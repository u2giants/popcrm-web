# HANDOFF — POP CRM codebase audit remediation

**Handoff status:** Session 1 complete; Session 2 code reviewed, pushed, CI
green, and awaiting its production worker restart/live authorization check
**Prepared:** 2026-07-26 (America/New_York)
**Repository:** `/worksp/popcrm-web` → GitHub `u2giants/popcrm-web`
**Branch:** `main` (main-only repository)
**Planning baseline:** `c217f1c` (vendor-only shared-db sync after audit commit `c17a86a`)

## Read this first

The complete zero-context build specification is:

**[POP CRM codebase audit remediation plan](plan_codebase_audit_remediation.md)**

The plan and this handoff must be read together. The plan is authoritative for
scope, ordering, design decisions, rejected approaches, tests, verification,
access, rollback, and definition of done. This handoff records the present state
and the exact starting point. Do not implement from the short audit summary or
from memory.

## 2026-07-26 autonomous execution update

Albert asked Codex to execute every implementation phase serially, using one
fresh sub-agent per phase and Kimi K3 as the independent review gate. Session 1
was implemented by the dedicated `phase_1_worker_foundation` agent, reviewed
read-only by Kimi K3, corrected by the same agent, independently verified by the
primary agent, committed, and pushed.

### Session 1 result

- App commit: `ccf9565` (`test: make CRM worker import-safe`)
- Branch/remote: `u2giants/popcrm-web` `main`; pushed to `origin/main`
- Files changed:
  - `workers/crm-worker-supabase.mjs`
  - `workers/lib/worker-foundation.mjs`
  - `workers/worker-foundation.test.mjs`
  - `vitest.config.ts`
  - `workers/README.md`
- Production semantics preserved: importing the worker no longer reads the
  environment file, validates secrets, creates Supabase clients, dispatches a
  command, or binds a port. Direct CLI execution still validates Supabase
  configuration before command dispatch and preserves the existing systemd
  entry file and command names.
- Test seams now exist for authentication/access lookup, request-body reads,
  Fireflies signatures, upstream fetch, Graph cursor storage, and current time.
- Characterization coverage exists for subject normalization,
  routing-improvement ordering, address/domain normalization, explicit-secret
  signature success/failure, import safety, and dependency injection.

Verification after the Kimi-requested correction:

```text
npm test: PASS — 4 files / 17 tests
npm run lint: PASS — 0 errors; only the pre-existing src/App.tsx:48 warning
npm run build: PASS
node --check workers/crm-worker-supabase.mjs: PASS
node --check workers/lib/worker-foundation.mjs: PASS
import with nonexistent POPPIM_ENV_FILE and blank Supabase vars: IMPORT_OK
direct no-env CLI smoke: expected SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY error
git diff --check: PASS
```

Kimi K3 inspected the actual working-tree implementation. Its one actionable
finding was an unused alias import for the extracted signature helper in
`workers/crm-worker-supabase.mjs`; the same implementation agent removed it and
reran the complete Session 1 gate successfully. A requested final K3
confirmation could not run because the authenticated Kimi account reported its
billing-cycle quota exhausted. No Kimi configuration or credential was changed.

### Production rollout evidence and next action

On 2026-07-27 Albert explicitly authorized the production worker update and
restart. The production checkout was already at documentation commit `c0dca01`,
which contains worker implementation commit `ccf9565`.

- `popcrm-fireflies` was confirmed to run
  `node /app/workers/crm-worker-supabase.mjs fireflies-server`.
- Its `/app` path is a read-only bind mount from `/worksp/popcrm-web`.
- The container was restarted at `2026-07-27T19:49:14Z`.
- Post-restart logs contained
  `fireflies-server (supabase) listening on 8787`.
- `https://crm-fireflies.designflow.app/health` returned `{"ok":true}`.
- `popcrm-outlook-ingest.timer`, `popcrm-reroute.timer`,
  `popcrm-contact-sync.timer`, `popcrm-summarize.timer`, and
  `popcrm-apply-ignore-rules.timer` were all enabled and active/waiting. These
  one-shot jobs load the current worker file on each timer run, so they did not
  require a service restart for this import-safety-only change.

Session 1 is now **complete**. Start Session 2 with a fresh individual sub-agent:
enforce CRM authorization on Opportunity Chat, run Kimi K3 read-only review,
return any concrete findings to that same agent, then verify, commit, push,
confirm CI, and perform the authorized worker rollout/runtime checks required by
the plan.

### Session 2 code and review result

Session 2 was implemented by the dedicated `phase_2_chat_authorization` agent.
No shared-db migration or new API contract was needed: the worker verifies the
bearer token through Supabase Auth, then calls the existing
`api.current_user_profile()` contract with the caller's JWT context. Only an
active profile with CRM access or the administrator role may reach
service-role Opportunity Chat reads.

- App commit: `4c66402` (`fix: authorize CRM opportunity chat`)
- GitHub Build and Deploy:
  `https://github.com/u2giants/popcrm-web/actions/runs/30300857606` — passed
- Shared-db guard: passed
- Local verification: 5 test files / 30 tests, lint with only the known
  `src/App.tsx:48` warning, production build, worker/helper syntax, and
  `git diff --check` all passed.
- Required cases covered: missing/invalid token, valid non-CRM user,
  administrator, CRM-granted user, revoked access, explicitly inactive profile,
  malformed request, denied privileged-call assertions, and generic/non-leaking
  exception responses.

Kimi K3's first review returned `CHANGES`:

1. the shared public 500 response could expose a profile/PostgREST error message;
2. profile/chat exception paths lacked a generic-response regression test; and
3. the inactive-profile test used a missing profile rather than an explicitly
   inactive one.

The same implementation agent corrected all three. Public errors now return
only `internal_error`; server logs retain only safe route/name/code/status
fields; both failure paths are tested; and the inactive-profile gate is tested
directly. Kimi K3 re-reviewed the corrected diff and returned `APPROVE` with no
remaining actionable findings.

Session 2 is **code complete / rollout pending**. Do not start Session 3 until:

1. Albert explicitly authorizes updating/restarting the production
   `popcrm-fireflies` worker on commit `4c66402`;
2. the production checkout is verified to contain that worker commit;
3. `popcrm-fireflies` is restarted and its health/logs are checked; and
4. safe live checks prove missing/invalid credentials return 401, an
   authenticated non-CRM identity returns 403 when an appropriate identity is
   available, and the authorized CRM test identity reaches the endpoint without
   exposing internal errors. Do not log or document JWTs.

---

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM frontend. POP staff use it to manage
customers, contacts, departments, sales opportunities/programs,
Outlook-ingested email routing, Fireflies meeting notes, notes, tasks, licensor
approvals, and AI-model settings.

The frontend is a Vite 8 / React 19 / TypeScript 6 single-page application
served by nginx. It uses TanStack Query and the shared Supabase backend. The
repository also owns `workers/crm-worker-supabase.mjs`, the Node runtime used by
host-side systemd jobs and the Fireflies webhook/opportunity-chat service.

Important locations:

- Application repository: `/worksp/popcrm-web`
- Canonical shared database repository: `/worksp/shared-db`
- Production CRM: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Shared production Supabase: `qsllyeztdwjgirsysgai`
- Shared preview Supabase: `xjcyeuvzkhtzsheknaiu`
- Fireflies worker/health host: `https://crm-fireflies.designflow.app`
- Frontend image: `ghcr.io/u2giants/popcrm-web`
- Coolify frontend application UUID: `a1vb55by4benmh25nd4ga8pt`

The browser never receives a service-role key. Browser reads use authorized
`api.crm_*` views/RPCs and browser writes use guarded RPCs or CRM-owned tables.
The worker uses the Supabase service-role credential, so every public worker
endpoint must independently enforce authentication and CRM authorization.

---

## 2. What we set out to do this session, and why

Albert asked for the latest repository to be pulled and the entire codebase
reviewed for bugs, inefficient code, poor code, security issues, and other
problems. That audit synchronized `main` at `c17a86a`, inspected frontend,
worker, systemd, CI/deploy, Docker/nginx, dependencies, and tests, and validated
findings with automated commands. Before the documentation commit landed,
`origin/main` advanced to `c217f1c` through a vendored shared-db-only sync; the
planning session rebased safely, and no audited project-owned code changed.

Albert then asked for:

1. a comprehensive implementation plan using the
   `implementation-plan-writer` standard;
2. an independent Grok critique;
3. evaluation and integration of Grok's critique; and
4. a link to the final plan from `HANDOFF.md`.

The business goal is to make POP CRM secure, reliable, scalable, accurately
reported, regression-tested, and deployable without asking later sessions to
rediscover the audit. No production behavior was changed in this planning
session.

---

## 3. Current state

### What is complete

- Local `main` was fetched/rebased and matched `origin/main` at `c217f1c`
  before landing documentation. That commit only synchronized vendored
  shared-db evidence; audited application/worker/CI code still matches the
  `c17a86a` audit baseline.
- The whole-codebase audit was completed.
- Baseline verification completed:
  - `npm test`: 3 test files / 10 tests passed.
  - `npm run build`: passed.
  - `npm run lint`: passed with one known warning at `src/App.tsx:48`.
  - `node --check workers/crm-worker-supabase.mjs`: passed.
  - `npm audit`: 12 advisories (1 critical, 5 high, 5 moderate, 1 low).
  - Extracted deployment shell failed `bash -n` at the unmatched `fi`, proving
    the workflow defect.
- The implementation plan was reconciled against current code and expanded to
  fifteen fresh-session phases covering fourteen verified findings.
- Official xAI Grok Build 0.2.112 was installed at
  `/home/ai/.grok/bin/grok`.
- Grok reviewed the full plan and `AGENTS.md` read-only using the existing xAI
  credential from 1Password. It returned **APPROVE WITH CHANGES**.
- Grok's critique was evaluated item by item. Accepted and rejected suggestions,
  with reasons, are recorded in the plan under
  **Independent Grok critique and integration**.
- Accepted critique is integrated:
  - shared-db work and frontend integration are split into Sessions 7A/7B;
  - test mechanics/negative assertions are explicit;
  - the retired promotion risk is described accurately;
  - startup and worker rollout gates are stronger.
- This `HANDOFF.md` links the final plan.

### What is not implemented

Every remediation ledger row in the plan is still `pending`. In particular:

- Opportunity Chat still checks only for a valid shared-Supabase user before
  service-role CRM reads.
- Fireflies signature validation still fails open when its secret is absent.
- HTTP request bodies and upstream calls remain unbounded.
- Outlook ingest still takes only the newest 50 lookback messages.
- Overview/sidebar still derive statistics from broad browser reads.
- Dependencies still have the audited advisories.
- CI still omits `npm test`.
- The deployment workflow still has malformed shell.
- Auth race/warning fixes are not implemented.
- High-volume worker jobs still use fixed 100,000-row scans and serial N+1
  work.
- Dead ingested-domain promotion mutation/UI residue remains.

### Commit/push/deploy state

The plan and `HANDOFF.md` are delivered in the documentation commit containing
this file; retrieve its immutable SHA with:

```bash
git log -1 --format=%H -- HANDOFF.md
```

The planning session pushes that commit to `origin/main` and reports the SHA in
its final response. No application/worker remediation or production deployment
is part of this documentation-only commit.

---

## 4. Everything tried that did not work

1. **Initial local validation failed with `eslint: Permission denied`.**
   `node_modules` had been installed with unusable ownership/permissions. A
   clean `npm ci` repaired the ignored local dependency tree. Afterward tests,
   lint, and build ran normally. This was an environment issue, not source code.

2. **The first independent Codex whole-repository review exceeded its
   120-second wrapper timeout.**
   It still performed useful inspection, but no complete final review was
   available. The primary audit therefore relied on direct code inspection and
   independently run commands rather than treating partial model output as
   authoritative.

3. **Grok was not initially installed.**
   `command -v grok`, managed paths, and Windows mounts returned nothing. The
   official xAI Linux installer installed Grok Build 0.2.112. This changed only
   user-level tooling under `/home/ai/.grok`, not repository source.

4. **Grok initially reported “You are not authenticated.”**
   The existing xAI API credential was located by title in 1Password vault
   `vibe_coding`, item `grok xai x.ai`, field `api key`. It was injected into
   the one read-only Grok process without revealing the value or writing it to
   disk/source.

5. **Not every Grok recommendation was correct.**
   Grok overstated that the plan implicitly authorized production changes and
   that rollback guidance was absent. The plan already explicitly made
   production/shared infrastructure read-only without exact current-chat
   authority and already included risk-specific rollback. Those recommendations
   were rejected rather than copied blindly. The plan records all judgments.

6. **A blanket larger worker cap was rejected.**
   Raising `.limit(100000)` would increase load without guaranteeing complete
   traversal. The accepted design is deterministic keyset batching,
   idempotency/checkpointing, bulk lookup/update where possible, and bounded
   concurrency.

7. **Keeping the error-only Promote button as documentation was rejected.**
   The current failure is safe and loud, but an action that can never succeed is
   misleading. Session 14 removes the dead mutation/action while preserving
   static guidance and historical fields where backend evidence requires them.

---

## 5. Root causes and key findings

The complete evidence is in plan Sections 5-6. The highest-impact findings are:

1. **Service-role authorization boundary is incomplete.**
   `workers/crm-worker-supabase.mjs:843-876` validates authentication but not
   CRM app access; `:420-449` then reads CRM context with the service-role
   client.

2. **Fireflies security fails open.**
   `workers/crm-worker-supabase.mjs:736-745` returns true when
   `FIREFLIES_WEBHOOK_SECRET` is missing.

3. **Outlook ingestion can permanently miss bursts.**
   `workers/crm-worker-supabase.mjs:57` and `:543-550` request only 50 recent
   messages and ignore Graph paging/delta links.

4. **Resource use is unbounded.**
   Worker request handling at `:865-890` buffers full bodies, upstream fetches
   have no abort timeout, and systemd one-shots have no execution deadline.

5. **Dashboard counts are expensive and sometimes incomplete.**
   `src/features/crm/queries.ts:273-291` downloads seven collections every 90
   seconds. Email reads silently cap at 500 in `src/features/crm/api.ts:711-718`,
   so “total” values can actually be recent-subset values.

6. **Worker batch paths do not scale or guarantee completeness.**
   `workers/crm-worker-supabase.mjs:591-610`, `:632-679`, `:694-699`, and
   `:714-732` use fixed 100,000-row scans and serial per-row work.

7. **Deployment verification is syntactically broken.**
   `.github/workflows/deploy.yml:143-149` contains an unmatched `fi`/loop tail.

8. **Regression gates are weak.**
   CI does not run Vitest, and only 10 utility-focused tests exist for roughly
   15,000 lines of non-generated application/worker code.

9. **Auth state can resolve out of order.**
   `src/auth/auth.tsx:98-131` has no stale-refresh generation/session guard.

10. **Retired promotion remains as dead surface.**
    `src/features/crm/api.ts:496-506`,
    `src/features/crm/queries.ts:360-383`, and
    `src/features/crm/pages/CustomersPage.tsx:83-90,272-288` retain an
    always-failing mutation and error-only button. This is currently safe, but
    misleading and unnecessary.

---

## 6. Exact next steps

Do not attempt all findings in one context window. Follow the plan's progress
ledger serially.

1. Open and read the entire
   [implementation plan](plan_codebase_audit_remediation.md), `AGENTS.md`, and
   this handoff.
   - Verification: the implementer can state the fourteen findings, fifteen
     sessions, shared-db gate, worker rollout gate, and current first pending
     session without consulting chat history.

2. Pull `origin/main` and inspect `git status --short --branch` in
   `/worksp/popcrm-web`.
   - Verification: local `main` matches `origin/main`; unrelated changes are
     identified and preserved.

3. Start **Session 1 — Create a testable worker foundation** only.
   - Make worker helpers import-safe without executing environment validation,
     creating clients, binding ports, or dispatching commands.
   - Add the exact characterization tests named in Session 1/Section 10.
   - Verification: `npm test`, lint, build, worker syntax, and import-only tests
     pass with no external calls or secret reads.

4. Update only Session 1's ledger row with commit and verification evidence.
   Commit/push that focused change to app `main`, confirm CI, and follow the
   worker rollout authority gate.
   - Verification: the row accurately distinguishes `complete` from
     `code complete / rollout pending`.

5. Cut to a fresh session and begin Session 2 only after Session 1's gate is
   satisfied. Repeat the plan's drift check before every later phase.
   - Verification: each phase lands independently with its named tests and no
     later-session scope mixed in.

6. At Session 7A, switch to canonical `/worksp/shared-db`, inspect its status,
   and follow branch + PR + preview-first procedure. Stop before production
   apply/merge unless the exact action is authorized in that session.
   - Verification: migration/PR/preview evidence is durable and Session 7B does
     not start before authorized merge/apply/vendor sync.

7. Do not delete `HANDOFF.md` until all fifteen ledger rows are complete and
   every code/runtime/database/deploy gate in plan Section 13 is satisfied.
   - Verification: when it is finally deleted, no unfinished work or rollout
     remains.

---

## 7. Constraints and gotchas

- App repository policy: direct work on `main`; no feature branches.
- Shared-db policy: dedicated branch + PR, preview-first, canonical
  `/worksp/shared-db`; never create app-local migrations or edit the vendored
  mirror.
- Production/shared infrastructure is read-only unless Albert authorizes the
  exact mutation in the current chat. The plan is not authorization.
- GitHub is code truth; no direct live-server editing or routine SSH deploys.
- Secrets live only in 1Password vault `vibe_coding`; never put values in
  source, docs, prompts, logs, test fixtures, or command arguments.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to Vite/browser configuration.
- Preserve unrelated dirty/untracked files and stage only session-owned paths.
- Do not replace exact counts with arbitrary client-side caps.
- High-volume reads require bounded/keyset contracts and ID tie-breakers.
- Do not restore all-or-nothing bootstrap loading.
- Ingested domains remain CRM-private triage evidence; never promote/link them
  to `core.customer`.
- UI changes require a local serve, desktop/mobile screenshots, and console
  inspection.
- Fireflies `/health` proves liveness, not ingestion.
- Frontend push/deploy does not roll out host worker code. The worker rollout
  requires the approved automation and runtime-SHA evidence in plan Section 12.
- GPT-5.6 Codex sessions must use low or medium reasoning effort only.

---

## 8. Access and environment

Known tools/context:

- `gh` is expected to be authenticated as `u2giants`; verify with a real
  read-only call before relying on it.
- Grok Build 0.2.112 is installed at `/home/ai/.grok/bin/grok`.
- Grok's xAI credential is in 1Password vault `vibe_coding`, item
  `grok xai x.ai`, field `api key`; inject it, never reveal it.
- CRM browser test login: vault `vibe_coding`, item
  `POP CRM live test login - Codex`.
- Worker environment: vault `vibe_coding`, item
  `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env`.
- Supabase CLI token and production/preview DB passwords are referenced in plan
  Section 12. Verify references without revealing values.

Local baseline:

```bash
cd /worksp/popcrm-web
npm ci
npm test
npm run lint
npm run build
node --check workers/crm-worker-supabase.mjs
```

Use 1Password injection for runtime environment values. Do not create a tracked
`.env`.

---

## 9. Open questions and risks

These are genuine execution-time questions with criteria, not permission to
guess:

1. Does production currently define `FIREFLIES_WEBHOOK_SECRET`? Verify only
   existence/metadata before fail-closed rollout; do not rotate it.
2. Can an existing canonical integration-state contract safely own the Outlook
   delta cursor? Reuse only if ownership, RLS, uniqueness, and lifecycle match;
   otherwise add a CRM-owned contract through shared-db.
3. Which Overview aggregate shape performs best? Decide from preview
   access-control tests and `EXPLAIN (ANALYZE, BUFFERS)`, not preference.
4. Which dependency advisories remain when Session 8 starts? Re-run both full
   and production-only audits; advisory data is time-sensitive.
5. What request/body/systemd limits fit real traffic? Measure non-secret payload
   sizes and job durations, add headroom, validate positive configuration, and
   fail loudly.
6. Which high-volume worker operations need shared-db RPCs/checkpoints? Prefer
   app-only pure batching when it is complete and efficient; use canonical
   shared-db when durable progress or database-side batching is required.

Primary rollout risks are authorization lockout, webhook startup outage from
missing configuration, skipped/duplicated Outlook or batch work, aggregate
count mismatches, chart regressions, and timeouts that are too short. Plan
Section 13 defines the prevention and rollback criteria for each.

---

## Handoff self-audit

- Could a developer who walked in today continue without asking what the
  application is, what happened, or what to do next? **Yes:** Sections 1-3 and
  6 define the system, present state, and first executable phase.
- Could that developer continue as effectively as the planning session?
  **Yes:** the linked 13-section plan carries every finding, decision,
  dependency, test, verification gate, access rule, and rollback criterion.
- Are failed attempts and rejected approaches recorded? **Yes:** Section 4 and
  plan Section 7 record what failed and why.
- Is every next step concrete and verifiable? **Yes:** Section 6 names the plan
  phase, files/behavior, and a verification gate.
- Are terms, paths, URLs, access locations, and authority boundaries explained?
  **Yes:** Sections 1, 7, and 8 define them without exposing secrets.

**Self-audit result: PASS.**
