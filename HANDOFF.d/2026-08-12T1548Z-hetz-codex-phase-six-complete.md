# Fresh-session handoff: Phase 6 complete, Phase 7A next

Status: OPEN for the next audit phase
Created: 2026-08-12 15:48 UTC
Machine: hetz
Agent: Codex

## 0. DECISIONS ONLY THE OWNER CAN MAKE

### Needed for the next phase, not needed to inspect or design it

1. **Phase 7A production database approval:** after the future Overview/sidebar aggregate contracts are preview-proven and reviewed, Albert must approve their exact production migration allowlist through the guarded shared-db workflow. Recommendation: approve only after preview count, access-control, and query-plan evidence is recorded. This blocks Phase 7B production use, not Phase 7A design or preview work.

### Already settled, do not re-ask

- 2026-08-12: Phase 6 production database migration and Outlook worker rollout were explicitly approved and completed.
- 2026-08-12: Phase 6 uses Microsoft Graph delta synchronization plus the shared `crm.worker_delta_cursor` compare-and-swap contract. Do not restore the newest-message lookback as the primary path.
- 2026-08-12: Graph cursor links are secret-like opaque values. Never print them or expose them through browser or health endpoints.
- The audit remediation executes serially with a fresh implementation agent and Kimi K3 review/fix loop for each phase.

The next session should present the one Phase 7A production decision only when preview and review gates pass. No owner decision is needed to start Phase 7A safely.

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM. Staff use it for customers, contacts, sales opportunities, Outlook email routing, Fireflies meeting notes, tasks, approvals, and AI settings.

- App checkout: `/worksp/popcrm-web`, GitHub `u2giants/popcrm-web`, branch `main`
- Production UI: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Shared Supabase production project: `qsllyeztdwjgirsysgai`
- Shared Supabase preview branch: `rjyboqwcdzcocqgmsyel`
- Canonical database repo: `/worksp/shared-db`, GitHub `u2giants/shared-db`
- Audit plan: `/worksp/popcrm-web/plan_codebase_audit_remediation.md`
- Outlook worker: `/worksp/popcrm-web/workers/crm-worker-supabase.mjs`
- Outlook schedule: `popcrm-outlook-ingest.timer`, every 15 minutes

The React/Vite frontend stores no data itself. CRM, PIM, DAM, and DesignFlow share the Supabase backend, so database contracts begin in canonical shared-db under its single-orchestrator workflow.

## 2. What we set out to do this session, and why

This session completed Phase 6 of the audit remediation plan. The old Outlook worker fetched only a bounded newest-message window. A burst larger than that window could permanently hide older unseen mail. Duplicate protection by `outlook_message_id` prevented duplicate rows but could not prove every message was discovered.

Phase 6A created the durable database cursor contract. Phase 6B replaced the lookback with Microsoft Graph delta pagination, exact-host continuation-link validation, process-before-save ordering, restart/resume, bounded expired-token rebuild, tombstone handling, and compare-and-swap protection against two workers overwriting each other.

## 3. Current state

### Database contract, complete in production

- Shared-db PR: `u2giants/shared-db#801`, merge commit `326c25e16123029af3b302945d283a729801a995`.
- Migration: `20260812010000_crm_worker_delta_cursor.sql`.
- Objects: `crm.worker_delta_cursor`, `crm.load_worker_delta_cursor(text)`, `crm.save_worker_delta_cursor(text,text,text,text,uuid)`, `crm.worker_delta_cursor_status(text)`, and `crm.worker_cursor_privilege_ok(text,text)`.
- Preview: applied and contract-tested on `rjyboqwcdzcocqgmsyel`.
- Production: applied alone to `qsllyeztdwjgirsysgai` by guarded GitHub Actions run `31613800275` at shared-db SHA `0f42555c9dca23574a23fc6fe992cd0a716c5991`.
- Browser roles have no access. The worker uses service-role-only RPCs. The status function never returns the opaque link.

### App implementation, complete and deployed

- Production app/worker commit: `3abaf6105161aaf30a5d669391c75bd80325a7c1`.
- The implementation content was initially committed as `739312d`, temporarily reverted as `9ec9a5e` after the live timer exposed the missing production contract, then reapplied and rebased over three vendor syncs. The final public SHAs are `d31a7f2` implementation, `29713d2` safety revert, and `3abaf61` final reapply.
- CI/deploy run `31614092763` passed verify, image build/push, Coolify deploy, and exact production commit check.
- Shared-db guard run `31614092775` passed.
- Local final gate: 8 test files / 111 tests passed; lint had zero errors and only the known `src/App.tsx:48` Phase 12 warning; TypeScript/Vite build passed; worker/test syntax and `git diff --check` passed.
- Kimi session `popcrm-phase6b-outlook-delta` returned `VERDICT: APPROVE` after one correction round. Review files are local and ignored under `.ai/reviews/`.

### Production runtime evidence

- First authorized manual run at 11:46:20 EDT: `2 created, 27 duplicates, 0 tombstones, 21 gated, 50 fetched across 6 pages; cursor saved`.
- Immediate resume at 11:46:27 EDT: `0 created, 1 duplicates, 0 tombstones, 0 gated, 1 fetched across 1 page; cursor saved`.
- Timer was re-enabled at 11:48 EDT. Its immediate run succeeded: `1 created, 0 duplicates, 2 tombstones, 0 gated, 3 fetched across 1 page; cursor saved`.
- `popcrm-outlook-ingest.timer` is active/waiting for the next quarter-hour run; the service result is success with exit status 0.
- Tombstones are acknowledged but do not delete retained CRM email history.

### Working tree

- `main` and `origin/main` were both `3abaf61` before this documentation commit.
- The untracked file `HANDOFF.d/2026-08-11T0133Z-hetz-codex-phase-five-timeouts.md` belongs to another session. Do not edit, delete, rename, or accidentally commit it.
- This session deleted only its own two superseded Phase 6 handoffs; git history preserves them.

## 4. Everything tried that did not work

### Starting Phase 6B before production had the contract

The worker implementation lived in the shared checkout before production promotion. The host timer reads that checkout directly, so scheduled runs at 09:30 and 09:45 EDT picked up the new code and failed safely with `PGRST202`, because `crm.load_worker_delta_cursor` did not yet exist in production. No emails were changed, but two ingest cycles were missed. The timer was stopped, the implementation was reverted before the next cycle, and the rollout order became database first, worker second.

### Assuming a local commit is isolated from production workers

That assumption was false on this host. The systemd service executes `/worksp/popcrm-web/workers/crm-worker-supabase.mjs` directly. An unpushed local worker edit is already production-visible at the next timer firing. Future worker phases must stop the affected timer before the first working-tree edit, or implement in an isolated worktree and integrate only inside an approved stopped window.

### First Kimi review

Kimi returned `CHANGES`. The first implementation surfaced a stale compare-and-swap database refusal instead of reloading and replaying, validated the expired-token configuration after requesting a Graph token, kept double-counted totals after a mid-walk 410 rebuild, and lacked contract-facing RPC wiring coverage. The same implementation agent fixed all four and Kimi then approved.

One Kimi statement was rejected after reading the real migration: `advanced:false` is not a stale refusal. A stale version raises `P0001`; `advanced:false` means the same link was successfully saved, the version rotated, and `advanced_at` did not move. The worker now warns safely on that no-progress success.

### First production environment approval API call

The first GitHub approval call serialized environment ID `19098244175` as text, and GitHub returned HTTP 422 because it required an integer array. The job remained paused and production unchanged. Submitting a JSON file with a numeric `environment_ids` array succeeded.

### First app push

The first `git push` was rejected because three automated shared-db vendor sync commits had advanced `origin/main`. The local Phase 6 implementation/revert/reapply sequence was rebased over `origin/main` without discarding the foreign untracked handoff, tests were rerun, and the push succeeded.

## 5. Root causes and key findings

1. `workers/crm-worker-supabase.mjs` now uses Graph `/mailFolders/inbox/messages/delta`, follows validated `@odata.nextLink` pages, and saves only the final `@odata.deltaLink` after every message succeeds.
2. `validateGraphDeltaLink` accepts only HTTPS, exact hostname `graph.microsoft.com`, no credentials, and no explicit port. This prevents bearer-token forwarding to lookalike hosts.
3. `createGraphCursorStore` calls the exact service-role RPCs and suppresses database error text, preserving only safe code `P0001` for stale-writer handling. A real cursor link cannot enter the journal through an RPC error.
4. Stale writers reload and replay from the winner's cursor, with a two-retry cap. Replays are safe because inserts remain idempotent by `outlook_message_id`.
5. An expired Graph cursor permits one loud full delta rebuild by default. `OUTLOOK_DELTA_EXPIRED_RESYNC_MAX` allows 0-3 and is validated before any Graph network call. There is no silent newest-message fallback.
6. Operator totals reset when a 410 occurs after partial pages, so final counts describe the successful rebuild rather than double-counting abandoned pages.
7. The host timer reads the live working checkout, not a release copy. This is the most important operational finding for future worker phases.
8. Phase 7A remains valid and is next. It is database-first and must use the current shared-db orchestrator issue workflow. Phase 7B remains blocked until 7A is merged, promoted as authorized, and vendor-synced. Phases 8-12 remain valid. Phase 13 must reuse `crm.worker_delta_cursor` or its compare-and-swap pattern for durable checkpoints rather than inventing another state system. Phase 14 remains valid.

## 6. Exact next steps

1. Start Session 7A with a fresh implementation agent only after reading current `/worksp/shared-db/AGENTS.md`. From this consumer repo, file the exact bounded `db-work` request and let the one shared-db orchestrator dispatch it. **You will know it worked when:** the issue names the aggregate objects, claimed object set, branch/PR, migration, and preview-only gate.
2. Inventory every Sidebar/Overview count, chart, and recent-row requirement listed in Session 7A before designing RPCs. **Gate:** a durable mapping names each displayed value, source table, filter, failure boundary, and maximum recent-row count.
3. Build purpose-specific browser-safe aggregate/recent contracts in canonical shared-db, with CRM authorization and representative query-plan evidence. **Gate:** shared-db checks pass; preview counts match direct fixtures; a CRM user succeeds; a valid non-CRM user is denied; EXPLAIN evidence is saved.
4. Use a fresh implementation agent and return every Kimi K3 finding to that same agent until `APPROVE`. **Gate:** final review says `APPROVE`, or any bounded unresolved objection is recorded explicitly.
5. Ask Albert once for the exact Phase 7A production allowlist only after preview proof and review. **Gate:** the request names exact SHA, migration versions, recorded review, and expected objects; no frontend rollout is bundled.
6. Begin Session 7B only after the contract is in production and the app vendor sync is on `main`. Regenerate types through the canonical workflow, replace unbounded stats fetches, run tests/build, and visually verify desktop/mobile Overview. **Gate:** browser network inspection shows only aggregate/bounded calls and displayed totals match the baseline.
7. For every later worker phase, stop only the affected timer before editing the live checkout or use an isolated worktree. **Gate:** no scheduled job can execute unapproved working-tree code.

## 7. Constraints and gotchas

- Production/shared infrastructure changes require exact current-chat approval. Phase 6 approval is spent and does not authorize Phase 7.
- App repo is main-only. Shared-db uses branch + PR under its single orchestrator.
- Consumer sessions do not author shared schema or directly edit `/worksp/shared-db`.
- The preview ref is `rjyboqwcdzcocqgmsyel`; old `xjcyeuvzkhtzsheknaiu` references were corrected in the plan.
- Never log, fixture, paste, or expose a real Graph delta link.
- 1Password reads must be serialized; vault is `vibe_coding` only.
- Verify commit identity as `Albert Hazan <u2giants@users.noreply.github.com>` before every commit.
- Do not touch another session's `HANDOFF.d/` file.
- The `src/App.tsx:48` lint warning belongs to Phase 12.
- GPT-5.6/Codex reasoning effort stays low or medium.

## 8. Access and environment

- Machine: `hetz`
- App checkout: `/worksp/popcrm-web`, branch `main`
- Canonical DB checkout: `/worksp/shared-db`; consumer sessions treat it read-only
- GitHub CLI: authenticated as `u2giants`; workflow dispatch, environment approval, push, and run inspection worked
- Kimi wrapper: authenticated; pin `kimi-code/k3`; session `popcrm-phase6b-outlook-delta`
- Host administration: noninteractive `sudo` worked for the exact approved Outlook timer/service actions
- Worker secrets: 1Password vault `vibe_coding`; host environment `/home/ai/.crm-worker.env`; values were not read or changed
- Production DB workflow: `u2giants/shared-db` run `31613800275`
- App CI/deploy: `u2giants/popcrm-web` run `31614092763`
- Production timer: `popcrm-outlook-ingest.timer`

## 9. Open questions and risks

- No Phase 6 question remains open. Database, worker, CI, deployment, resume behavior, tombstones, and timer health are proven.
- Phase 7A's exact aggregate object names and grouping remain design work for its shared-db implementation agent.
- The live-checkout timer risk remains for every future worker edit. Treat it as an operational constraint, not a one-time incident.
- The automated app deploy still reports Docker advisory warnings about public `VITE_*` build arguments and Node action runtime deprecation. They did not fail this phase and were not introduced here; do not mix them into Phase 7 unless the plan assigns them.
- 2026-08-12 drift decision: Phase 13 should reuse the generic cursor/state contract when its checkpoint semantics match; if it needs a different state shape, justify that difference in shared-db rather than copying compare-and-swap code.

## Sub-agent record

### Phase 6B implementation agent `/root/phase_6b_outlook_delta`

- Asked to implement Graph delta pagination, durable cursor integration, crash/restart safety, security validation, tests, and docs without production or database changes.
- Changed the intended seven app files and added `workers/outlook-delta.test.mjs`; it did not commit, push, touch secrets, production, shared-db, or handoffs.
- First result passed 104 tests but Kimi found stale-writer, config-order, rebuild-count, and wiring-test defects.
- The same agent fixed every finding. Final result passed 111 tests and Kimi returned `APPROVE`.
- The sub-agent work is finished; no separate worktree or branch remains.

## Mandatory self-audit

1. **Can a brand-new developer continue without context? Yes.** Sections 1-3 define the app, repos, plan, exact database/app/runtime state, SHAs, runs, and the next phase.
2. **Can they continue as effectively as this session? Yes.** Sections 4-8 preserve every material dead end, the live-checkout timer discovery, Kimi adjudication, contract semantics, access, and exact Phase 7 workflow.
3. **Is every needed detail present? Yes.** Goals, outcomes, failures, decisions, constraints, risks, next actions, tests, review, CI, deploy, and production evidence are mapped across Sections 2-9 and the sub-agent record.
4. **Would Albert see every decision from Section 0 alone? Yes.** A line-by-line sweep of Sections 1-9 and the sub-agent record found only the future Phase 7A production approval; it appears in Section 0 with recommendation and blocking effect. Phase 6 decisions are listed as settled and must not be re-asked.

Self-audit result: PASSED.
