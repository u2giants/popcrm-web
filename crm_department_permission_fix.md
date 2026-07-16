# CRM "permission denied for table department" — diagnosis + fix handoff

Status: **fix authored, not yet applied to production.** The bug is NOT fixed
for users until the production database step below runs. No popcrm-web code
change is needed — the app is correct; the fix is a database grant in the
shared backend.

If you are the session picking this up: read this whole file, then do the
"What remains" steps. The fix lives in the shared database repo
`u2giants/shared-db` as pull request **#79** (branch
`claude/grant-crm-write-dml`), because all shared-Supabase schema/grant changes
must be authored there, never in this app repo (the `shared-db-guard` workflow
enforces this).

---

## 1. Symptom

In popcrm-web **Triage**, creating a new department inside a Customer fails:

```
Could not create department
permission denied for table department — Hint: Grant the required privileges to
the current role with: GRANT INSERT ON crm.department TO authenticated; (42501)
```

## 2. Root cause (verified against canonical shared-db, not the stale local mirror)

`42501` is a **table-level privilege** error — the `authenticated` role has no
`INSERT` on `crm.department`. This is distinct from a row-level-security (RLS)
rejection, which instead reads `new row violates row-level security policy`.

- popcrm-web writes the `crm.*` operational tables **directly** via supabase-js.
  That is the intended design — see the header comment of shared-db migration
  `20260621151359_crm_api_rpcs.sql`, which says the `crm_write` RLS policy
  "already lets sales/licensing/admin write them directly, so the frontend
  writes those base tables."
- shared-db baseline `20260621151155_api_rls_realtime.sql` set up a permissive
  `crm_write` RLS policy (`for all to authenticated`, gated to
  administrator/sales/licensing) on the `crm.*` operational tables — BUT its
  grants block only ran `grant select on all tables in schema crm to
  authenticated`. It granted reads only. `INSERT`/`UPDATE`/`DELETE` were never
  granted.
- **An RLS policy is not a table grant.** Postgres checks the table-level
  privilege first, so every *direct* browser write to a `crm.*` table returns
  `42501`. Department is simply the first one exercised — by the same logic,
  opportunity/task/note/meeting/etc. direct writes are affected too.
- The 2026-07-10 parity reconcile
  (`20260710135985_reconcile_permission_parity.sql`) did **not** fix this — it
  adjusted `service_role` privileges only, nothing for `authenticated`. No
  migration anywhere in canonical shared-db grants DML on `crm.*` to
  `authenticated`.

### Why it is not an app bug (code path, for reference)

- `src/features/crm/pages/TriagePage.tsx:142` → `createDepartment.mutateAsync(...)`
- `src/features/crm/api.ts` `createDepartment` (~line 660) →
  `insertReturning('department', ...)`
- `insertReturning` (~lines 207-219) runs
  `supabase.schema('crm').from('department').insert(payload)...` — a direct
  table write. `updateDepartment`/`deleteDepartment` do the same for
  update/delete. All correct; they just need the grant to exist.

## 3. The fix

shared-db migration `20260715220500_grant_crm_write_dml_to_authenticated.sql`
(on branch `claude/grant-crm-write-dml`, PR #79):

```sql
grant insert, update, delete on
  crm.department,
  crm.opportunity,
  crm.opportunity_product,
  crm.email_message,
  crm.meeting_note,
  crm.note,
  crm.task,
  crm.ignore_rule,
  crm.ai_model_config,
  crm.licensor_approval_thread
to authenticated;

notify pgrst, 'reload schema';
```

- Exactly the ten `crm.*` tables that carry the `crm_write` RLS policy.
- `crm.ingested_domain` is **deliberately excluded**: it also carries
  `crm_write`, but popcrm-web writes it only through the
  `record_ingested_domain` / `promote_ingested_domain` RPCs, so it stays
  select-only.
- RLS still gates which rows a caller may write (admin/sales/licensing). The
  grant only supplies the table privilege the policy already assumed.
- Additive and idempotent — safe to re-run, no drops/renames/data changes, does
  not touch the in-flight ERP mirror relocation.

## 4. What remains (do these to actually fix production)

The shared-db merge protocol is preview-first (see shared-db `AGENTS.md` §5 and
§9). From a session/machine that has the Supabase CLI and the 1Password
credentials:

1. Get PR #79's branch and link to the **preview** project
   (`xjcyeuvzkhtzsheknaiu`). Credentials are in the 1Password `vibe_coding`
   vault: item "Supabase CLI Personal Access Token" for `supabase login`, and
   "Supabase Preview Branch Credentials - shared POP database
   (shared-db-schema-rehearsal)" for the preview DB password. **Never put these
   values in a file.**
2. `supabase db push --dry-run` — confirm it lists **only**
   `20260715220500_grant_crm_write_dml_to_authenticated.sql`. If it wants to
   apply other migrations, preview is behind `main`: **stop and serialize**
   (shared-db `AGENTS.md` §4) — do not let unrelated changes ride along.
3. `supabase db push` to apply to preview.
4. Verify:
   `select has_table_privilege('authenticated','crm.department','insert');`
   should return `true`.
5. Merge PR #79 to `main` (this auto-syncs the read-only `shared-db/` mirror
   into the app repos).
6. Promote to **production** in an approved window: link to
   `qsllyeztdwjgirsysgai` (1Password "Supabase DB Password - shared POP
   database") and `supabase db push`. **This is the step that fixes the bug for
   users.**
7. Confirm: creating a department in Triage now works.

## 5. Watch out for

- **42501 vs RLS.** `42501 permission denied for table` = missing grant (this
  bug). `new row violates row-level security policy` = a different, RLS problem.
  Don't confuse them.
- **The `shared-db/` folder inside this repo is a stale, read-only snapshot.**
  It auto-syncs only when shared-db `main` updates, and it lagged canonical by
  ~60 migrations during diagnosis. Diagnose against the canonical
  `u2giants/shared-db` repo, not this mirror.
- **Broader than department.** The same missing grant affects all direct
  `crm.*` writes. If a user reports only department failing but other CRM writes
  working, there may be a production-only grant not captured in tracked
  migrations — the preview dry-run will show the truth. The migration is
  idempotent, so it is safe even if some grants already exist in production.
- **Merging the PR does not fix production.** Only the production
  `supabase db push` (step 6) does.
- **PostgREST caches privileges.** The migration ends with
  `notify pgrst, 'reload schema'`; if writes still return 42501 immediately
  after applying, give PostgREST a moment / reload its schema cache.
- **Do not attempt the fix in this app repo.** App-side DDL/grants are blocked
  by `shared-db-guard` and violate the DB gatekeeper rule. It must go through
  shared-db PR #79.

## 6. Already done / evidence

- Migration + these details also documented durably in shared-db at
  `docs/app-migration-notes/popcrm-web-20260716.md` and shared-db `AGENTS.md`
  §11 (on PR #79's branch).
- PR #79 CI (`validate`) is green; shared-db `scripts/check-sql.sh` passes
  (static checks). Preview apply, production promotion, and the in-app Triage
  retest are the outstanding items.
- popcrm-web branch `claude/triage-dept-permission-denied-t6pw0n` is
  intentionally empty — no app change was required.
