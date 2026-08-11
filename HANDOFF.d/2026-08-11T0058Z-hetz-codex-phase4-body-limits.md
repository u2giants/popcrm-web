# POP CRM Phase 4 request-body limits

## 0. Decisions only the owner can make

### Blocking

1. **Authorize the Phase 4 production Fireflies worker restart and security checks.** Recommendation: approve it. The code is published and the frontend deployment passed, but the always-running Node worker must restart before it loads the new request limits. This blocks only the production worker rollout, not the published code.

### Recoverable choices

2. **Decide whether to continue the remaining audit phases 5 through 14.** Recommendation: continue in order, one fresh agent and one Kimi K3 review per phase, as originally requested. Phase 5 is next.

### Already settled. Do not re-ask

- On 2026-07-27, Albert approved and completed Fireflies Webhooks V2 setup with a signing secret.
- On 2026-07-27, Albert approved the Phase 3 worker update and restart.
- On 2026-08-10 local time, Albert explicitly asked to publish Phase 4.

The next session must present both open decisions above to Albert in one message before any production restart or Phase 5 production action.

## 1. What this application is

`popcrm-web` is POP Creations' internal customer relationship management application. Staff use it for customers, contacts, sales opportunities, Outlook email routing, Fireflies meeting notes, tasks, approvals, and AI settings.

- Repository: `/worksp/popcrm-web`, GitHub `u2giants/popcrm-web`
- Branch policy: `main` only
- Frontend: React, TypeScript, and Vite, served by nginx
- Production: `https://crm.designflow.app`
- Shared backend: Supabase project `qsllyeztdwjgirsysgai`
- Fireflies worker health: `https://crm-fireflies.designflow.app/health`
- Worker source: `workers/crm-worker-supabase.mjs`
- Full remediation plan: `plan_codebase_audit_remediation.md`
- Earlier Phase 1 through 3 history: `HANDOFF.d/2026-08-11T0054Z-hetz-codex-legacy-audit-remediation.md`

## 2. What we set out to do this session, and why

This old session was resumed to determine whether its unfinished Phase 4 work had been replaced. Ground truth showed it had not. Albert then asked to publish Phase 4.

Phase 4 protects the two public worker endpoints from clients that send unlimited data. Without a limit, one request could consume excessive memory or keep the process busy. The implementation adds exact byte limits, clear safe errors, and tests for broken or interrupted uploads while preserving Fireflies signature verification and fast acknowledgement.

## 3. Current state: what is true right now

Phase 4 is implemented, reviewed, committed, pushed, built, and deployed as frontend commit `fe34c94` on `main`.

- Shared body reader and configuration: `workers/lib/worker-foundation.mjs:104-206`
- Route integration: `workers/crm-worker-supabase.mjs:861`
- Tests: `workers/http-body-limits.test.mjs:1-219`
- Operator documentation: `workers/README.md:55-62`
- Configuration documentation: `docs/configuration.md:119-126`
- Opportunity Chat default limit: 65,536 bytes
- Fireflies default limit: 1,048,576 bytes
- Oversized request response: HTTP 413 `payload_too_large`
- Broken JSON response: HTTP 400 `invalid_json`

Verification on 2026-08-11 UTC:

- `npm test -- --run`: 82 of 82 tests passed
- `npm run lint`: passed with only the already-known `src/App.tsx:48` warning
- `npm run build`: passed
- Node syntax checks for both worker modules: passed
- Kimi K3 final review: `APPROVE`
- GitHub shared-db guard run `31447673054`: passed
- GitHub Build and Deploy run `31447673058`: passed
- Production frontend: served exact commit `fe34c94`

The production `popcrm-fireflies` process has not been restarted for Phase 4. The source is present on the host checkout, but the running Node process keeps its already-loaded code until restart. Production security behavior therefore remains at the completed Phase 3 level until Albert authorizes the Phase 4 restart.

Phases 5 through 14 remain unstarted according to the progress ledger in `plan_codebase_audit_remediation.md`.

## 4. Everything we tried that did not work

1. The first stale-session check relied on the local remote-tracking branch and appeared to show no newer commits. That was incomplete because the repository had not fetched GitHub recently. A real `git fetch origin main` revealed 209 newer commits. All 209 were read-only `shared-db/` vendor synchronization commits, so none replaced or conflicted with Phase 4.
2. Publishing immediately without reconciliation would have been unsafe. We stopped, inspected the changed paths, proved the newer commits touched only `shared-db/`, then used `git pull --rebase --autostash` and reran every Phase 4 gate.
3. The repository used an obsolete full root `HANDOFF.md`. Current rules prohibit shared mutable handoffs. It was moved verbatim to `HANDOFF.d/2026-08-11T0054Z-hetz-codex-legacy-audit-remediation.md`, and the root became the static pointer. No historical text was rewritten.

## 5. Root causes and key findings

- The original risk was duplicate unbounded request-body buffering in public routes. The shared fix is `readJsonBody` at `workers/lib/worker-foundation.mjs:150`.
- Limits are validated as positive safe integers before the Fireflies server listens. Defaults are at `workers/lib/worker-foundation.mjs:104-106`.
- Fireflies signature verification still receives the exact raw bytes before JSON parsing. This preserves Phase 3 security.
- Kimi found that a request error arriving after early cleanup could become an unhandled process error. The implementation keeps a one-shot inert late-error guard, with a regression test in `workers/http-body-limits.test.mjs`.
- GitHub had moved ahead by 209 commits, but all were vendored shared-database syncs. The project-owned Phase 4 files had no overlap.

## 6. Exact next steps

1. Ask Albert once for authorization to restart only `popcrm-fireflies` and run Phase 4 security checks. You will know authorization exists when Albert explicitly says yes to the Phase 4 production worker restart and checks.
2. Before restarting, verify the container is healthy and inspect its command, bind mount, network, restart policy, labels, and required nonblank environment names without printing values. You will know the preflight passed when the container matches the documented Phase 3 runtime and every required name is present.
3. Restart only `popcrm-fireflies`. Do not recreate it unless a plain restart cannot load required configuration. You will know it started when logs say the Fireflies server is listening on port 8787 and `/health` returns HTTP 200.
4. Send safe oversized unsigned requests to both public routes and confirm they return HTTP 413 before paid APIs or database work. Also confirm a normal unsigned Fireflies request remains HTTP 401 because signature security runs. You will know Phase 4 is live when the response ordering and worker logs match the tests without exposing request bodies.
5. Record the restart time and production evidence in a new write-once `HANDOFF.d/` file and update only the Phase 4 ledger evidence if needed. You will know documentation is complete when the new file passes the handoff self-audit and is pushed.
6. If Albert approves continuing, start Phase 5 from `plan_codebase_audit_remediation.md` with a fresh agent and Kimi K3 review. You will know the handoff succeeded when the new agent can begin from the plan and open handoffs without asking for missing context.

## 7. Constraints and gotchas in force

- Production is read-only until Albert explicitly authorizes the exact restart and checks.
- This app repository uses `main` only. Do not create a feature branch.
- GitHub is the source of truth. Do not edit deployed source separately from the repository.
- The shared Supabase schema is owned by `/worksp/shared-db`; Phase 4 makes no database changes.
- Never print or commit secrets. Worker secrets live outside git.
- Do not rewrite root `HANDOFF.md` or another session's `HANDOFF.d/` file.
- Fireflies health proves the server is reachable, not that a real meeting was ingested.
- A frontend deployment does not restart the separately running Fireflies worker.
- Keep Fireflies HMAC verification over exact raw bytes before parsing.

## 8. Access and environment

- Local repository: `/worksp/popcrm-web`, branch `main`
- GitHub CLI `gh`: authenticated and used to verify Actions
- Git identity verified before commit: `Albert Hazan <u2giants@users.noreply.github.com>`
- Production frontend deploy owner: GitHub Actions to GHCR to Coolify
- Fireflies runtime: Docker container `popcrm-fireflies` on the `coolify` network
- Worker secrets: mode-600 `/home/ai/.crm-worker.env` and 1Password vault `vibe_coding`, item `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env`
- Fireflies webhook URL: `https://crm-fireflies.designflow.app/s/fireflies-webhook`
- No secret values appear in this handoff or the commit.

## 9. Open questions and risks

- **Owner decision, 2026-08-11:** Phase 4 production worker restart is not authorized yet. This is repeated in section 0.
- **Owner decision, 2026-08-11:** Continuing Phases 5 through 14 should be confirmed after the Phase 4 rollout. This is repeated in section 0.
- The known `src/App.tsx:48` lint warning remains and belongs to planned Phase 12, not Phase 4.
- GitHub reports Node 20 action deprecation warnings and Docker warnings about public Vite build arguments. They did not fail this release and are outside Phase 4. They should be assessed in their owning CI/dependency phases, not patched opportunistically.

## Self-audit

1. **Yes.** Sections 1 through 9 give a new developer the app purpose, current proof, failures, file locations, access, and exact continuation steps.
2. **Yes.** Sections 3 through 5 preserve the non-obvious 209-commit reconciliation, Kimi finding, runtime distinction, and exact verification evidence.
3. **Yes.** Background, goal, outcome, state, failed attempts, decisions, constraints, risks, next actions, and evidence are covered in sections 1 through 9.
4. **Yes.** A line-by-line owner-decision sweep found two decisions in sections 6 and 9. Both are consolidated with recommendations and consequences in section 0. The already-settled list prevents repeated questions.
