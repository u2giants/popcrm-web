# Plan: recover 447 crm.ingested_domain.status values (infrastructure)

Incident: popcrm-web select-all bug (fixed in PR #19, commit bad5d26405abea594447b388334c849fbaf55864, now on main and deployed) wrote status='OTHER' to the 496 non-Lucasfilm rows of a 497-row list in shared Supabase project qsllyeztdwjgirsysgai. Owner intended only the first 50 (Lucasfilm, already OTHER since 02:10 EDT, then Bytedance through Aurora Gift). Blast radius is CRM-only.

Evidence (local, .ai/evidence/, gitignored; contains sender emails):
- snapshot_ingested_domain_20261027.json, sha256 aedffbef336855c3ebe609e84a4eb7400cd5b0e13629127eb259b1ee62a9ca3c: 497 rows read from live at 13:23 EDT, all OTHER.
- restore_targets_447.json, sha256 31ea49d12e0063cb2bd87aa72eba3532a695512f1e4a1cda059cb86a5838245c: the 447 victims, exactly the rows with updated_at in [17:06:41.237Z, 17:07:06.741Z]. The intended 49 span [17:05:33.232Z, 17:05:35.368Z]. The sets are disjoint.
- Management API backups: pitr_enabled=true; earliest physical backup 2026-10-20 18:18:56Z.

Guard choice: crm.record_ingested_domain (the 15-minute email ingest) bumps updated_at but never writes status. Only users change status. So the overwrite guard is status, not updated_at.

Steps
0. Pre-flight script asserts: 447 unique ids, all in the snapshot, disjoint from the intended 50.
1. Create a NEW temporary project via Supabase "Restore to new project" (PITR clone) of qsllyeztdwjgirsysgai at 2026-10-27T17:05:00Z (13:05:00 EDT, before the first bulk write at 17:05:33Z). Same org and region. The live project is never restored, undone or rolled back.
2. On the clone, read id, domain, status, updated_at for the 447 ids. Abort if: row count != 447; any clone updated_at >= 17:05:33Z; any status is NULL; or all 447 are OTHER (a no-op means the wrong point in time). Old values are restored exactly as found: no whitelist filter, the table has no status check constraint. Any value outside the current UI vocabulary is reported to the owner. Save the result to clone_old_values.json.
3. On live, snapshot id, domain, status and updated_at for the 447 ids to live_before_restore.json. Precompute outside the database the expected write count E = the number of ids where live status='OTHER' and the clone status<>'OTHER'. Ids whose live status is no longer OTHER were re-triaged by a person after the bug. They are skipped, never overwritten, and listed to the owner.
4. Rehearse the exact SQL on the clone first: set the 447 rows to OTHER, run the script, and require row count == E (computed the same way). Then run on live in one transaction over the direct connection (port 5432) as postgres, with lock_timeout 5s and statement_timeout 60s: temp table t(id uuid, old_status text) built by the script with parameter-safe VALUES; UPDATE crm.ingested_domain d SET status=t.old_status FROM t WHERE d.id=t.id AND d.status='OTHER' AND t.old_status<>'OTHER'. COMMIT only if the row count == E (the independently precomputed number); otherwise ROLLBACK and stop. The updated_at trigger bumps the written rows; the before/after values stay in the evidence files.
5. Save live_after_restore.json. Verify each id: written ids == clone status; skipped ids unchanged; the 50 intended ids still OTHER; per-status counts across the 447 == clone counts adjusted for the skip list; total table row count unchanged.
6. Delete the clone with DELETE /v1/projects/{clone_ref} and verify it no longer appears in the project list.
7. Add an entry to docs/critical-incidents.md.
Rollback: one transaction setting status='OTHER' for the written ids, only where status still equals the live_after_restore value; then re-verify against live_before_restore.json.
