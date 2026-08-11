# Fresh-session handoff: Phase 6A queued with shared-db orchestrator

Status: OPEN
Created: 2026-08-11 17:19 UTC
Machine: hetz
Agent: Codex

## 0. DECISIONS ONLY THE OWNER CAN MAKE

### Blocking later, but not blocking preview work

1. **Production database approval:** after the Outlook cursor migration is preview-proven and Kimi-approved, Albert must approve the exact production shared-database apply. Recommendation: approve only when issue #782 records the exact migration, SHA, allowlist, and preview proof. This blocks making the contract available in production and therefore blocks Phase 6B production use.
2. **Production Outlook worker approval:** after Phase 6B code is complete, tested, pushed, CI-green, and Kimi-approved, Albert must separately approve the exact production worker update/restart and verification. Recommendation: approve only the Outlook worker resources named in that request. This blocks production rollout, not local or preview work.

### Already settled, do not re-ask

- 2026-08-11: Phase 6 is split into 6A database contract first and 6B worker integration second.
- 2026-08-11: use a fresh implementation sub-agent and return Kimi K3 comments to that same agent until Kimi says `APPROVE`.
- 2026-08-11: do not change production without Albert's exact approval.
- 2026-08-11: app repositories do not implement shared schema. All schema work goes through the one active shared-db orchestrator.

The next session must present the whole owner-decision list in one message only when one of the two production gates is actually reached. Do not ask for either approval while #782 is merely queued.

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM. Staff use it for customers, contacts, sales opportunities, Outlook email routing, Fireflies meeting notes, tasks, approvals, and AI settings.

- App checkout: `/worksp/popcrm-web`, GitHub `u2giants/popcrm-web`, branch `main`
- Production UI: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Shared Supabase production project: `qsllyeztdwjgirsysgai`
- Shared Supabase preview branch: `rjyboqwcdzcocqgmsyel`
- Canonical database repo: `/worksp/shared-db`, GitHub `u2giants/shared-db`
- Audit plan: `/worksp/popcrm-web/plan_codebase_audit_remediation.md`

The frontend stores no data itself. CRM, PIM, DAM, and DesignFlow share the backend, so the shared-db repo and its single orchestrator own all database contracts.

## 2. What this session set out to do, and why

The request was to continue the audit plan from Phase 6, complete Phase 6A through the canonical shared-db workflow, then complete Phase 6B only after the durable Outlook cursor contract was approved and available. The request also required a fresh implementation sub-agent and a Kimi K3 review/fix loop.

Phase 6 fixes a real completeness risk. The Outlook worker currently fetches a bounded newest-message window. If a burst is larger than that window, older unseen messages can be skipped permanently. The permanent design is Microsoft Graph page traversal plus a durable delta cursor that advances only after all fetched work succeeds.

## 3. Current state

### App repository

- Local `main` and `origin/main` both point to `5191d3506874ad03e66257cc3febda81f339c720` (`docs: hand off phase six cursor contract`).
- No Phase 6 app code was changed.
- No Phase 6 tests or Kimi review were run because the required database contract is not yet available.
- Current bounded fetch remains in `workers/crm-worker-supabase.mjs`, around lines 554-610.
- The injectable cursor-store seam remains a non-durable stub in `workers/lib/worker-foundation.mjs`, around line 424.
- The unrelated untracked file `HANDOFF.d/2026-08-11T0133Z-hetz-codex-phase-five-timeouts.md` belongs to another session. Never edit, delete, rename, or accidentally commit it.

### Shared database

- The live shared-db rules say a consumer/app session must not edit `/worksp/shared-db`. It must open a `db-work` GitHub issue and stop.
- A complete request was created as [u2giants/shared-db issue #782](https://github.com/u2giants/shared-db/issues/782), titled `HANDOVER: PopCRM durable Outlook delta cursor contract`.
- Issue #782 is OPEN, has label `db-work`, and had no comments or claim at 17:19 UTC on 2026-08-11.
- Active orchestrator marker: [shared-db issue #777](https://github.com/u2giants/shared-db/issues/777), `ORCHESTRATOR ACTIVE — shared-db-orchestrator-1067a1 — al8960ofc`.
- `/worksp/shared-db` was clean when checked. This app session made no files, branches, migrations, commits, preview writes, merges, or production changes there.
- Production status: unchanged. No database or worker mutation was attempted.

## 4. Everything tried that did not work

### Continuing Phase 6A directly in `/worksp/shared-db`

This is forbidden by the current canonical rulebook. `/worksp/shared-db/AGENTS.md` requires all non-orchestrator sessions to open a GitHub issue and stop. Direct edits or a locally spawned database agent would create a second schema workstream outside the collision controls.

### Starting the requested app implementation agent immediately

This would force Phase 6B to invent or guess an unmerged persistence contract. The plan explicitly forbids that. The fresh app implementation agent must not be created until Phase 6A is approved and available.

### Waiting briefly for an immediate orchestrator claim

The active orchestrator marker exists, but #782 remained open with no comments after a short wait and a fresh status check. A consumer session cannot take ownership merely because the orchestrator has not responded yet.

### Expanding the recent-message lookback or using a local cursor file

Both remain rejected. A larger lookback reduces frequency but does not eliminate permanent skips. A local file is not durable across deploys/restarts and cannot coordinate future worker instances.

## 5. Root causes and key findings

1. Idempotency by `outlook_message_id` prevents duplicate inserts for messages the worker sees, but it does not prove the worker discovered every message.
2. The current bounded fetch is not Microsoft Graph delta synchronization and cannot prove completeness.
3. The existing cursor-store dependency seam is useful, but it has no durable shared-db backing.
4. A Graph delta link is opaque and potentially sensitive. It must never appear in logs, fixtures, issue bodies, PR text, commits, or handoffs.
5. The correct Phase 6A shape is a narrow CRM-owned, service-role-only load/save contract with browser denial, safe non-secret identity fields, and update timestamps. Exact object names must follow current shared-db conventions and be selected by its implementation agent.
6. The shared-db preview is a shared mutable branch, not a disposable clean database. The orchestrator must run its collision check and prove the preview project ref immediately before every write.
7. The plan still contains stale preview ref `xjcyeuvzkhtzsheknaiu` in older sections. The current canonical preview ref is `rjyboqwcdzcocqgmsyel`; the shared-db rulebook wins. This drift must be corrected when the plan is next updated by the session that owns the implementation evidence.

## 6. Exact next steps

1. Monitor issue #782 without editing shared-db. **You will know this worked when:** the orchestrator comments with a claim, branch/PR, or a precise question.
2. Ensure the shared-db orchestrator uses a fresh implementation sub-agent in an isolated worktree and runs the collision check for every intended object. **Gate:** #782 or its PR names the agent/workstream, claimed objects, branch, and unique migration filename.
3. Require the Phase 6A implementation to add the smallest additive service-role-only cursor contract and tests for browser denial, narrow load/save, atomic replacement, and non-exposure. **Gate:** shared-db SQL checks pass and the diff contains no browser-readable token path.
4. Require preview-only dry-run, apply, and verification on `rjyboqwcdzcocqgmsyel`, with the project ref quoted immediately before each write. **Gate:** issue/PR evidence names the preview ref, intended migration only, object existence, authorization results, and safe load/save results without exposing a token.
5. Require Kimi K3 to review the complete Phase 6A diff. Return every actionable comment to the same shared-db implementation agent, then re-review. **Gate:** Kimi's final recorded verdict is exactly `APPROVE`, or all unresolved objections are explicitly recorded after the allowed review turns.
6. Stop and ask Albert once for the exact production database apply only after steps 1-5 pass. **Gate:** the request names the exact SHA, migration allowlist, workflow action, and expected effect. No worker rollout is included.
7. After the contract is authorized, applied, merged, and vendor-synced/available, start Phase 6B with a fresh app implementation sub-agent. **Gate:** the agent can point to the real contract names and production/preview availability rather than inventing them.
8. Phase 6B must implement validated Graph `@odata.nextLink` traversal, initial sync to completion, commit of `@odata.deltaLink` only after all page/message work succeeds, restart/resume, tombstones, explicit expired-token resync alerts, 429 handling, and idempotency. **Gate:** tests cover 125 messages over three pages, page-two crash with no cursor advance, duplicates, empty delta, tombstones, expired token, malicious link, 429, and restart/resume.
9. Run app tests, lint, build, worker syntax, diff checks, and a preview-backed idempotent one-shot. Have Kimi K3 review Phase 6B and return findings to the same app implementation agent until `APPROVE`. **Gate:** app commit is pushed, CI is green, and no production worker was restarted.
10. Ask Albert for the exact production Outlook worker update/restart only then. **Gate:** approved resources are updated, restart/resume is proven, counts are recorded, no token leaks, and timer health is green.
11. Re-read all remaining phases and update the plan ledger with final Phase 6 evidence. **Gate:** Phases 7A-14 are checked against the actual contract and current code before the next handoff.

## 7. Constraints and gotchas

- Production and shared cloud infrastructure are read-only without exact approval in the active chat.
- App schema changes start in canonical shared-db. Never write migrations in this app or its vendored `shared-db/` mirror.
- One shared-db orchestrator owns all shared schema implementation agents. Do not spawn a parallel database agent from this app session.
- Use a fresh implementation agent for Phase 6B and return Kimi comments to that same agent until approval.
- Never expose real Graph delta links or secrets.
- Serialize all 1Password reads. Secrets live only in vault `vibe_coding`.
- App work is main-only. Before any commit, verify identity is `Albert Hazan <u2giants@users.noreply.github.com>`.
- Do not touch another session's `HANDOFF.d/` file.
- The known lint warning at `src/App.tsx:48` belongs to Phase 12.
- GPT-5.6/Codex reasoning effort must stay low or medium.

## 8. Access and environment

- Machine: `hetz`
- App: `/worksp/popcrm-web`, `main`
- Canonical DB: `/worksp/shared-db`; consumer session must treat it read-only
- GitHub CLI is authenticated as `u2giants`; real reads and issue creation succeeded
- Shared-db issue: `https://github.com/u2giants/shared-db/issues/782`
- Orchestrator marker: `https://github.com/u2giants/shared-db/issues/777`
- Secrets: 1Password vault `vibe_coding`; never record values
- Production worker environment: `/home/ai/.crm-worker.env`; never commit or print it
- Outlook worker code: `workers/crm-worker-supabase.mjs`
- Worker foundation: `workers/lib/worker-foundation.mjs`

## 9. Open questions, risks, and dated decisions

- **2026-08-11 decision:** Phase 6A and 6B remain strictly gated. No app implementation against an invented contract.
- **2026-08-11 status:** #782 is queued, unclaimed, and is the only safe next action.
- **Open design question:** exact table/function names and compare-and-replace behavior must be settled by the shared-db implementation agent against current conventions.
- **Risk:** advancing a cursor before every message is safely processed recreates permanent loss in a less visible form.
- **Risk:** expired Graph tokens must trigger a loud bounded resync path. Silent fallback to a newest-message window is forbidden.
- **Risk:** preview is shared and may contain unrelated rehearsals. The orchestrator must serialize and verify every intended object/version.
- **Drift review, 2026-08-11:** Sessions 7A and 7B remain correctly gated after Phase 6 and the shared-db contract. Sessions 8-12 remain independent in design and serial in execution. Session 13 must reuse the Phase 6 durable state/cursor pattern rather than create a second design. Session 14 remains valid. The stale preview ref in plan sections 2 and 12 must be corrected to `rjyboqwcdzcocqgmsyel` when implementation evidence next updates the plan.

## Sub-agent and external-review record

No implementation sub-agent was started in this session. That was deliberate: the required Phase 6A agent belongs to the active shared-db orchestrator, and the Phase 6B agent is forbidden until the contract exists. Kimi K3 was not invoked because there is no implementation diff to review. Issue #782 explicitly requires both the fresh shared-db implementation agent and the Kimi review/fix loop.

## Mandatory self-audit

- All sections 0-9 are present.
- Every owner approval appears in Section 0 with a recommendation and the exact gate it blocks.
- A newcomer can continue from issue #782 without chat history.
- Failed paths and why they failed are recorded in Section 4.
- Every next step has a concrete verification gate.
- Repos, refs, paths, URLs, SHAs, secret locations, branch state, preview status, production status, and the foreign untracked handoff are explicit.
- No secret or cursor value is present.
- The remaining-phase drift check is recorded in Section 9.

Self-audit result: PASSED.
