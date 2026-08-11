# Fresh-session handoff: Phase 6 Outlook cursor contract

Status: OPEN
Created: 2026-08-11 17:09 UTC
Machine: hetz
Agent: Codex

## 0. Owner decisions and approvals

### Needed later, not needed to begin safe preview work

1. **Production shared-database application:** after the Phase 6A migration is
   proven in preview and reviewed, Albert must explicitly authorize applying
   that exact durable Outlook cursor contract to production if the active
   shared-db procedure requires owner approval at that gate. Recommendation:
   approve only after preview evidence and Kimi K3 approval are recorded.
2. **Production worker rollout:** after Phase 6B is merged, CI is green, and
   Kimi K3 approves, Albert must explicitly authorize updating/restarting the
   affected production Outlook worker and running its security/durability
   checks. Do not treat prior Phase 1-5 approvals as authority for Phase 6.

No owner action is required to inspect, design, branch, test, or preview Phase
6A. Ask once at the relevant production gate, with the exact resources and
actions named.

### Already decided

- Work proceeds serially by phase with a fresh implementation agent and Kimi K3
  review/fix loop for each phase.
- Phases 1-5 are complete and production-verified.
- Fireflies Webhooks V2, its signing secret, and the production worker setup are
  already complete. Do not reopen that work unless new evidence shows a fault.
- GitHub is the code source of truth. Do not live-edit production.

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM. Staff use it for customers,
contacts, sales opportunities, Outlook email routing, Fireflies meeting notes,
tasks, approvals, and AI settings.

- App repo: `/worksp/popcrm-web`, GitHub `u2giants/popcrm-web`, branch `main`
- Production UI: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Shared backend: Supabase project `qsllyeztdwjgirsysgai`
- Canonical database repo: `/worksp/shared-db`, GitHub
  `u2giants/shared-db`
- Fireflies worker health: `https://crm-fireflies.designflow.app`
- CRM workers: `workers/crm-worker-supabase.mjs`; scheduled host jobs use the
  templates under `systemd/`

The frontend stores no data itself. The CRM, PIM, and DAM share the same
Supabase backend, so any database contract must be created first in canonical
`shared-db` through its guarded workflow.

## 2. What this session set out to do, and why

The long-running audit remediation plan is
`plan_codebase_audit_remediation.md`. This logical session completed and
published Phase 5, then started Phase 6 with a clean implementation sub-agent.

Phase 6 exists because Outlook ingestion currently relies on a newest-message
lookback. If more messages arrive than the lookback covers, older unseen mail
can be skipped permanently. The permanent fix is Microsoft Graph pagination
plus a durable delta cursor that advances only after successful processing.

The Phase 6 inspection found that app implementation cannot safely begin yet:
the worker has only a cursor-store stub, and the shared database has no durable
Outlook cursor contract. Phase 6 therefore must run as Phase 6A database
contract first, then Phase 6B worker integration.

This session also performed the required whole-plan drift check and added an
end-of-every-phase rule requiring all downstream phases to be re-read before
handoff.

## 3. Current state

### Proven complete

- Phases 1-5 are marked complete in the plan ledger.
- Latest Phase 5 implementation commit: `94ab3c7`.
- Phase 5 production-verification documentation commit: `6be5c6b`.
- At the last verification, local `main` and `origin/main` both pointed to
  `6be5c6bc0d19a77aea215c4b120a257a068ecb58` before this handoff commit.
- Phase 5 production has all five scheduled worker units installed with bounded
  runtimes, all five timers active, and Fireflies health/security checks green.
- `/worksp/shared-db` was clean on `main` at the end of the inspection.

### Phase 6 exact state

- No Phase 6 app code, database migration, secret, or production change exists.
- No Phase 6 Kimi review has occurred because there is no implementation diff.
- Current ingestion logic is in
  `workers/crm-worker-supabase.mjs:554-610`. `fetchRecentEmails` fetches one
  recent page and then relies on idempotent inserts keyed by
  `outlook_message_id`.
- The injectable foundation has a placeholder cursor store at
  `workers/lib/worker-foundation.mjs:424`; `load` and `save` are not backed by
  durable state.
- Existing shared-db history includes the Outlook message identifier, but the
  Phase 6 inspection found no durable Graph delta cursor table/RPC contract.
- The plan now explicitly splits Session 6 into 6A and 6B and forbids worker
  implementation against an invented/unmerged contract.

### Working-copy ownership warning

Another completed agent created this untracked write-once file:
`HANDOFF.d/2026-08-11T0133Z-hetz-codex-phase-five-timeouts.md`.
Do not edit, delete, rename, or accidentally commit it. It is owned by that
agent/session. This handoff and the plan clarification are the only files this
session owns.

## 4. Everything tried that did not work

### Treating Phase 6 as an app-only implementation

The Phase 6 sub-agent was asked to implement durable Outlook ingestion in the
app repo. Inspection showed that this would require inventing a persistence
shape in app code before the shared backend exposes one. That would violate the
shared-db gate and risk coupling the worker to a contract that never lands.

The agent correctly stopped without changes. This was not a coding failure. It
identified a missing prerequisite that the original plan allowed conditionally
but did not make explicit enough.

### Using the current recent-message lookback as the cursor

The existing newest-page/lookback approach is idempotent for messages it sees,
but it is not complete. A burst larger than the fetched window can leave older
messages unseen forever. Increasing the page size or lookback would only make
the gap less frequent; it would not make ingestion durable.

### Storing a cursor in a local file

This was considered by the original audit and rejected. App containers and
deploy checkouts are not durable database state. A local file can disappear on
restart/deploy and cannot safely coordinate future worker instances.

## 5. Root causes and key findings

1. `workers/crm-worker-supabase.mjs:554-610` performs a bounded recent fetch,
   not full Graph page traversal or delta continuation.
2. `workers/lib/worker-foundation.mjs:424` exposes a useful dependency seam but
   its cursor store is only a stub. The seam should be retained and backed by a
   narrow shared-db contract.
3. Idempotency by `outlook_message_id` prevents duplicate row creation but does
   not prove every message was discovered.
4. A Graph delta link may contain an opaque continuation token. It must not be
   printed in logs or exposed to browser clients. Store and access it only
   through a worker-appropriate, narrow contract.
5. The canonical shared-db repository now has its own orchestrator rules. The
   next session must read its current `AGENTS.md` and route Phase 6A through the
   approved shared-db orchestrator/issue/branch workflow instead of making a
   casual consumer-repo database edit.
6. Phase 13 also concerns high-volume workers. It remains valid, but its worker
   state/pagination choices must reuse the Phase 6 pattern instead of creating a
   second cursor design.

## 6. Exact next steps

1. Read `/worksp/popcrm-web/AGENTS.md`, the root `HANDOFF.md` pointer, and every
   OPEN file under `HANDOFF.d/` newest-first. Read
   `plan_codebase_audit_remediation.md`, especially Session 6 and all downstream
   sessions. **Gate:** the agent can state which workstream is active and which
   foreign handoff file must remain untouched.
2. Fetch/sync `main` safely and confirm `/worksp/popcrm-web` has no unrelated
   tracked changes. Check `/worksp/shared-db` status without modifying it.
   **Gate:** app `main` matches its remote except for known owner/session files,
   and shared-db has no unrelated dirty migration.
3. Read `/worksp/shared-db/AGENTS.md` and use its current shared-db orchestrator
   path. If it requires a GitHub issue/handoff from consumer repos, create that
   exact scoped request. Do not bypass the orchestrator. **Gate:** Phase 6A has
   an owned shared-db branch/PR/work item with no unrelated changes.
4. Design the smallest CRM-owned durable worker-state contract for one Outlook
   mailbox/integration. It must support atomic load/save of the opaque delta
   link, prevent browser access, identify the cursor purpose/mailbox without
   exposing secrets, record safe update times, and avoid logging the token.
   Prefer a narrow service-role-only table/RPC consistent with current
   shared-db standards. **Gate:** migration tests prove unauthorized/browser
   access is denied and the worker can load/save only the intended state.
5. Prove Phase 6A in preview, run all shared-db checks, and have Kimi K3 review
   the complete database diff. Return every actionable Kimi comment to the same
   implementation agent until Kimi says `APPROVE`. **Gate:** preview evidence,
   green checks, and final Kimi approval are recorded in the plan/work item.
6. At the production database gate, ask Albert once for the exact approval
   described in Section 0 if the active shared-db procedure requires it. Merge,
   apply, and wait for any required vendor sync only after authority is clear.
   **Gate:** the production contract exists and its exact migration/merge SHA is
   recorded, with no app worker rollout yet.
7. Start Phase 6B with a fresh app implementation agent. Add validated Graph
   `@odata.nextLink` traversal, initial sync to completion, commit the
   `@odata.deltaLink` only after every page/message succeeds, restart/resume,
   tombstone handling, explicit expired-token resync alerts, and idempotency.
   Never advance the durable cursor after a failed page or message. **Gate:**
   the plan's 125-message, crash, duplicate, empty-delta, tombstone, expired
   token, malicious-link, 429, and restart tests all pass.
8. Run app tests, lint, build, worker syntax, and a preview-backed idempotent
   one-shot check. Have Kimi K3 review Phase 6B and loop fixes back to the same
   agent until `APPROVE`. Publish through GitHub/CI. **Gate:** commit pushed,
   CI green, deployed artifact identified, and no production worker restarted.
9. Ask Albert for the exact Phase 6 production Outlook worker update/restart and
   durability/security checks. After authorization, update only the named
   worker resources and verify counts, restart/resume, no secret leakage, and
   timer health. **Gate:** production evidence is recorded in the plan ledger.
10. At Phase 6 completion, re-read Sessions 7A through 14. Record drift,
    especially Phase 13's reuse of the cursor/state pattern, then write a new
    write-once handoff or continue only if the fresh-context rule still permits.

## 7. Constraints and gotchas

- Albert is not a programmer. Report outcomes in plain business English and
  give click instructions only when browser-only action is unavoidable.
- Production/shared infrastructure is read-only until Albert explicitly names
  and authorizes the exact mutation in the current chat.
- Database/schema/API-contract changes begin in canonical `/worksp/shared-db`,
  branch + PR + preview-first. Never author migrations in this app's vendored
  `shared-db/` folder or in the Supabase dashboard.
- Read current shared-db orchestration instructions before doing anything there.
- Never put secrets or opaque Graph cursor tokens in commits, output, fixtures,
  logs, PR text, or handoffs.
- 1Password reads must be serialized. Vault is `vibe_coding` only.
- Do not rotate existing credentials without approval.
- Main-only for this app. Verify commit identity is
  `Albert Hazan <u2giants@users.noreply.github.com>` before committing.
- Use a separate implementation agent for each plan/phase and return Kimi K3
  comments to that same agent until approved.
- Never touch another session's file under `HANDOFF.d/`.
- The known lint warning at `src/App.tsx:48` belongs to Phase 12. Do not mix it
  into Phase 6.
- GPT-5.6/Codex reasoning effort must be low or medium only.

## 8. Access and environment

- Current machine: `hetz`
- App checkout: `/worksp/popcrm-web`, branch `main`
- Shared-db checkout: `/worksp/shared-db`; check its branch and instructions at
  session start
- GitHub CLI and normal authenticated engineering tools are expected to be
  available, but verify with a real read-only call before claiming access
- Secrets live in 1Password vault `vibe_coding`; production worker environment
  is `/home/ai/.crm-worker.env`, which must never be committed
- Production host workers are managed by systemd; Fireflies is the separate
  `popcrm-fireflies` container
- Phase 6 should affect the Outlook ingestion worker, not all workers and not
  Fireflies, unless evidence proves a shared runtime change requires more
- Current production URLs and non-secret identifiers are documented in
  `/worksp/popcrm-web/AGENTS.md`

## 9. Open questions, risks, and dated decisions

- **2026-08-11 decision:** split Phase 6 into 6A shared-db contract and 6B app
  worker integration. This prevents an app implementation from inventing its
  own persistence contract.
- **Open design question:** the precise shared-db object names and atomic update
  shape must follow current shared-db conventions. Resolve this inside Phase 6A
  review, not by guessing in the app repo.
- **Risk:** Graph delta links are opaque and potentially sensitive. Leakage in
  logs or broad API views would be a security defect.
- **Risk:** advancing the cursor before all messages are safely processed can
  recreate permanent data loss in a less visible form.
- **Risk:** expired delta tokens require a loud, bounded resync path. Silent
  fallback to a newest-message window is forbidden.
- **Downstream check:** Sessions 7A/7B, 8, 9, 10, 11, 12, and 14 remain valid.
  Session 13 remains valid but must reuse the Phase 6 cursor/state conventions.

## Coordinator and sub-agent handoff

### Phase 5 implementation agent

- Asked to implement external request timeouts/retries and five systemd job
  ceilings, with tests and documentation.
- Produced app commit `94ab3c7`.
- Kimi K3 found a retry-cap cleanup test weakness. The finding was returned to
  the same agent, fixed, and Kimi then returned `APPROVE`.
- After Albert's exact approval, production unit updates, reload, Fireflies
  restart, and timeout/security checks completed successfully.

### Phase 6 Outlook durability agent

- Asked to implement Session 6 in the app repo with no production mutation.
- Inspected the worker and shared-db contracts.
- Found the missing durable cursor contract described above.
- Made no app, database, secret, or production changes and created no commit.
- Kimi was not invoked because there was no implementation diff.
- The agent completed its bounded investigation correctly; Phase 6A is the next
  work item.

## Mandatory self-audit

1. **Could a new agent continue with no chat history? Yes.** Sections 1-3 define
   the app, goal, repos, state, commits, and exact blocker.
2. **Could it continue as effectively as this session? Yes.** Sections 5-8 give
   source locations, workflow constraints, access, and gated execution steps.
3. **Are failed approaches and reasons included? Yes.** Section 4 records the
   rejected app-only, lookback, and local-file paths and why each is unsafe.
4. **Is every next step concrete and verifiable? Yes.** Every item in Section 6
   names an action and an explicit success gate.

Self-audit result: PASSED.
