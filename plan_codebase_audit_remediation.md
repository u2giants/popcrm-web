# POP CRM codebase audit remediation plan

**Plan status:** Ready for implementation
**Prepared:** 2026-07-26 (America/New_York)
**Planning baseline:** `u2giants/popcrm-web` `main` at `c217f1c`
**Execution model:** Fifteen separate, fresh AI sessions covering fourteen findings, run serially in the order listed below
**Canonical plan file:** `/worksp/popcrm-web/plan_codebase_audit_remediation.md`

This file is both the handoff and the build specification. Every implementing
session must begin by re-reading this entire file, `AGENTS.md`, and any
`HANDOFF.md` that exists at that time. Each session must pull the latest
`origin/main` before editing because earlier sessions will have changed the
baseline.

---

## 1. The ultimate goal

POP CRM must remain dependable and secure as an internal operations system:
only authorized CRM users may retrieve CRM data, public worker endpoints must
fail safely, Outlook messages must not disappear during bursts, dashboard reads
must remain fast as data grows, deployments must be guarded by meaningful
automated tests, and routine dependency or authentication behavior must not
create avoidable operational risk.

When all fourteen findings and all fifteen implementation sessions are complete:

- cross-app Supabase users cannot use Opportunity Chat to retrieve CRM data;
- Fireflies refuses unsigned traffic and refuses to start without its required
  signing secret;
- public HTTP endpoints have bounded request bodies and upstream calls have
  bounded execution time;
- Outlook ingestion processes every message in its durable cursor stream rather
  than only the newest 50 messages in a lookback window;
- scheduled CRM workers process high-volume queues incrementally without
  rescanning up to 100,000 rows or issuing avoidable serial per-row queries;
- Overview and sidebar badges use purpose-built server aggregates/recent feeds,
  not repeated full-table browser downloads;
- production dependencies have no known high/critical advisories that apply to
  the shipped app, obsolete tooling is removed or correctly classified, and
  Recharts is on a maintained major version;
- GitHub Actions runs unit tests and contains clean, syntax-checked deployment
  shell;
- critical worker, auth, API, and page behavior has regression coverage;
- auth state cannot be restored by a stale asynchronous refresh after logout;
- the React auth-callback banner no longer causes the known effect/set-state
  lint warning;
- retired ingested-domain promotion code and its misleading disabled action are
  removed from the shipped UI and query layer; and
- every change is committed, pushed, green in CI, and the final application
  commit is verified live at `https://crm.designflow.app`.

**If any implementation step conflicts with this goal, the goal wins: stop and
flag the conflict rather than implementing the step literally.**

---

## 2. What this application is

`popcrm-web` is POP Creations' internal CRM frontend. Staff use it for customers,
contacts, departments, sales opportunities/programs, Outlook-ingested email
routing, Fireflies meeting notes, tasks, notes, licensor approvals, and AI model
settings.

### Repositories and branch policy

- Application: `/worksp/popcrm-web`, GitHub `u2giants/popcrm-web`
  - Work directly on `main`; do not create feature branches.
  - Git author: `Albert Hazan <u2giants@users.noreply.github.com>`.
- Shared Supabase contracts: `/worksp/shared-db`, GitHub
  `u2giants/shared-db`
  - Database changes use a dedicated branch plus PR.
  - Preview project first, then production, then merge the PR.
  - Never add an app-local migration to `popcrm-web`.

Sessions may not work concurrently in the same checkout. They are separate
context windows but intentionally serial: Session N starts only after Session
N-1 is committed, pushed, CI-green, and reflected in this plan's progress
ledger.

### Stack and runtime

- Vite 8, React 19, TypeScript 6
- TanStack Query and Supabase JS
- Static production bundle served by nginx in a Coolify-managed container
- Host-side Node worker: `workers/crm-worker-supabase.mjs`
- Worker scheduling: systemd templates in `systemd/`
- Shared backend: Supabase project `qsllyeztdwjgirsysgai`
- Shared backend preview: Supabase project `xjcyeuvzkhtzsheknaiu`

### Important URLs and identifiers

- Production CRM: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Fireflies health/webhook host:
  `https://crm-fireflies.designflow.app`
- Coolify application UUID: `a1vb55by4benmh25nd4ga8pt`
- GHCR image: `ghcr.io/u2giants/popcrm-web`

### Runtime ownership

The browser uses the user's Supabase JWT and browser-safe `api.crm_*` contracts.
The host worker uses `SUPABASE_SERVICE_ROLE_KEY`; therefore every public worker
endpoint must perform its own authorization before invoking service-role reads
or writes.

---

## 3. What triggered this work

On 2026-07-26, after synchronizing `popcrm-web` with GitHub, a whole-codebase
read-only audit examined project-owned frontend, worker, systemd, CI, Docker,
nginx, and configuration code. It excluded `node_modules`, `dist`, secrets,
AI-tool-local configuration, and the read-only vendored `shared-db/` mirror.

The audit and follow-up verification ran:

```bash
npm ci
npm test
npm run lint
npm run build
node --check workers/crm-worker-supabase.mjs
npm audit
```

Observed baseline:

- 3 test files / 10 tests passed.
- TypeScript and production build passed.
- ESLint passed with one warning at `src/App.tsx:48`.
- Worker syntax passed.
- `npm audit` reported 12 advisories: 1 critical, 5 high, 5 moderate,
  1 low.
- The deploy workflow's embedded shell was extracted and `bash -n` proved the
  unmatched `fi` is a real parse failure.
- Audit/first-plan baseline `c17a86a` was followed by vendor-only shared-db sync
  `c217f1c`. Current planning baseline `c217f1c` is synchronized with
  `origin/main`; the intervening commit did not change audited project-owned
  code, and no remediation code has been implemented yet.

The findings are mostly latent or load-dependent, so there is no single UI
click sequence that reproduces all of them. Each session below includes its own
reproduction/verification contract.

---

## 4. Scope

### In scope

This plan fixes all fourteen verified audit findings:

1. Opportunity Chat accepts any shared-Supabase user.
2. Fireflies webhook authentication fails open without a secret.
3. Outlook ingestion reads only the newest 50 messages.
4. Overview/sidebar stats download several complete datasets repeatedly.
5. Public worker requests have no body-size limit.
6. External worker calls and systemd jobs have no bounded timeout.
7. Known dependency advisories, misplaced `shadcn`, and unsupported Recharts 2.
8. GitHub Actions does not run `npm test`.
9. Critical behavior has inadequate automated coverage.
10. Auth refreshes can resolve out of order after sign-out.
11. Deployment shell contains unreachable malformed remnants.
12. Auth callback error state causes the known React lint warning.
13. High-volume scheduled workers rescan up to 100,000 rows and perform serial
    N+1 reads/writes, creating load growth and silent fixed-cap truncation.
14. Retired ingested-domain promotion remains represented by dead API/mutation
    code and a misleading UI action that can only display an error.

Documentation changes needed to keep `AGENTS.md`, `docs/architecture.md`,
`docs/development.md`, `docs/deployment.md`, and `workers/README.md` accurate
are in scope for the session that changes the documented behavior.

### Not in this plan

- General visual redesign, CSS cleanup, or component-library replacement.
- Rewriting `workers/crm-worker-supabase.mjs` into a new framework.
- Replacing Supabase, TanStack Query, systemd, Coolify, or GitHub Actions.
- Changing the CRM data model except for the narrowly scoped server aggregate
  contracts in Sessions 7A-7B.
- Direct production/shared-cloud mutations from an ordinary AI session.
- Fixing advisories that exist only in unused development tooling when the
  permanent solution is to remove that tooling; do not force incompatible
  dependency overrides merely to make `npm audit` print zero.
- Changing application behavior inside the vendored `shared-db/` directory.
- Testing Fireflies dashboard configuration; this plan hardens the receiving
  service, not the third-party dashboard.
- Broadly refactoring every full-list page. Sessions 7A-7B are limited to
  Overview and global sidebar statistics/recent activity.
- Rewriting every worker query at once. Session 13 is limited to the audited
  reroute, contact-sync, summarize, and ignore-rule batch paths and any shared
  helpers they need.

---

## 5. Current state of the code

The audited application code is unchanged from `c17a86a`; current planning
baseline `c217f1c` adds only a vendored shared-db sync. Remediation
implementation has not started. A top-level `HANDOFF.md` is created by the
planning session and links this plan. The planning checkout was clean before
documentation edits. Every implementation session must still preserve any
unrelated state it finds and stage only its own files.

### Existing behavior that must be preserved

- Browser reads normally use `api.crm_*` views/RPCs; guarded writes use existing
  RPCs or CRM-owned tables.
- Contact and customer segmented reads avoid known PostgREST timeout patterns.
- Email Routing uses a bounded recent feed and server-side segment counts.
- TanStack Query optimistic mutations roll back and invalidate related keys.
- Fireflies signatures are HMAC-SHA256 when a secret exists.
- Opportunity Chat already requires a valid Supabase JWT, but not CRM access.
- `crm-fireflies` health remains a liveness check only, not an ingestion proof.
- Docker CI passes commit identity through build arguments.
- The application deploy path remains GitHub Actions -> GHCR -> Coolify.

### Exact problem locations

| Finding | Current code |
|---|---|
| Chat authorization | `workers/crm-worker-supabase.mjs:843-876` validates only `sb.auth.getUser(token)`; `chatOpportunity` at `:420-449` uses service-role reads. |
| Fireflies fail-open | `workers/crm-worker-supabase.mjs:736-745` returns `true` when `FIREFLIES_WEBHOOK_SECRET` is absent. |
| Outlook truncation | `workers/crm-worker-supabase.mjs:57` sets `PAGE_SIZE = 50`; `:543-550` sends `$top=${PAGE_SIZE}`, returns only `.value`, and ignores `@odata.nextLink`. |
| Full stats loads | `src/features/crm/queries.ts:273-291` calls seven unlimited fetchers. `AppSidebar.tsx:15-29` and `OverviewPage.tsx:65-109` consume the arrays. |
| Unbounded bodies | `workers/crm-worker-supabase.mjs:865-890` accumulates request chunks without a byte cap. |
| Missing timeouts | `fetch(...)` calls at worker lines approximately `361`, `397`, `434`, `539`, `548`, and `758`; systemd services have no `TimeoutStartSec`. |
| Dependencies | `package.json:20-64`: `react-router-dom ^7.17.0` (a v7 minor/patch remediation, not a major migration), Recharts `2.15.4`, `shadcn` in production dependencies, Vitest `3.2.4`. |
| CI misses tests | `.github/workflows/deploy.yml:31-43`. |
| Coverage gap | Only `columnFilters.test.ts`, `_shared.test.ts`, and `searchResults.test.ts`; 10 tests total. |
| Auth race | `src/auth/auth.tsx:98-131` allows overlapping `refresh()` completions. |
| Workflow remnants | `.github/workflows/deploy.yml:143-149`; `bash -n` on the extracted run block fails at the unmatched `fi`. |
| React warning | `src/App.tsx:41-50` initializes to null, then calls `setAuthError` synchronously inside an effect. |
| Worker rescans/N+1 | `workers/crm-worker-supabase.mjs:591-610`, `:632-679`, `:694-699`, and `:714-732` read fixed sets of up to 100,000 rows and then perform serial per-row routing, lookup, summary, and update work. |
| Retired promotion residue | `src/features/crm/api.ts:496-506` deliberately fails loudly; `src/features/crm/queries.ts:360-383` nevertheless retains an unreachable optimistic mutation; `src/features/crm/pages/CustomersPage.tsx:83-90` and `:272-288` render a button whose only supported result is an explanatory error toast. The current behavior is safe, but the dead mutation surface and fake affordance should be removed. |

---

## 6. Key findings and root causes

### 6.1 Service-role authorization boundary is incomplete

`verifySupabaseUser` proves only that the token belongs to some authenticated
user in shared Supabase. CRM, DAM, PM/PIM, and PLM share that auth project.
`chatOpportunity` then bypasses RLS with the service-role client. Authentication
is not authorization; the missing condition is active CRM access or the
administrator role.

### 6.2 Webhook security is configuration-dependent in the unsafe direction

The absence of `FIREFLIES_WEBHOOK_SECRET` changes signature verification from
"deny" to "allow." This violates the standing no-silent-fallback rule. The
worker should fail during configuration validation before binding the port.

### 6.3 Outlook ingestion uses a moving lookback without paging

The query orders newest-first and takes 50. When a 20-minute window contains
more than 50 messages, older messages in that window are not returned. On later
runs they can fall outside the window. Deduplication by Outlook message ID does
not recover messages never fetched. Microsoft Graph delta queries are the
durable contract; following `@odata.nextLink` is the immediate minimum.

### 6.4 Dashboard aggregation happens in the browser

Overview requires both aggregates and small recent lists. It currently derives
both from seven unlimited arrays, refetched every 90 seconds and also used by
the sidebar. This wastes bandwidth and repeats query shapes already known to
time out at scale. Counts and recent rows belong in purpose-specific `api.*`
contracts authored in canonical shared-db.

### 6.5 HTTP and upstream resource use is unbounded

Node's raw request stream is fully buffered. Fetch calls have no abort signal.
The systemd templates also omit maximum run time. One slow or malicious request
can consume memory or leave a scheduled job running indefinitely.

### 6.6 CI validates compilation, not behavior

TypeScript compiles test files but does not execute assertions. The new Vitest
suite is therefore advisory locally rather than a deploy gate.

### 6.7 The worker monolith makes critical behavior difficult to test

The worker validates environment and dispatches a command at module load. Its
pure and I/O helpers are not exported. Tests need seams for authorization,
signatures, bounded request reads, Graph pagination/delta behavior, and fetch
timeouts without invoking real services or reading secrets.

### 6.8 Auth refresh lacks stale-result suppression

An earlier `current_user_profile()` request can finish after a newer sign-out
refresh. React then receives an obsolete `setRealUser`, making the shell look
signed in until another refresh while RLS requests fail.

### 6.9 Worker batch design does not scale or guarantee completeness

Several scheduled commands use `.limit(100000)` without a stable cursor,
checkpoint, or deterministic batch loop. The cap is therefore both expensive
and incomplete: every run can rescan already-seen history, while rows beyond
the cap may never be reached. Inside those scans, serial Supabase reads and
writes amplify latency and database load. The permanent fix is bounded,
deterministically ordered keyset work with durable progress/idempotency and
bulk lookups or bounded concurrency—not a larger fixed cap.

### 6.10 A retired operation is still modeled as an operation

Ingested-domain promotion is intentionally forbidden by the shared-customer
architecture. The current always-throwing function and error toast are a
deliberate loud failure, so this is not an active data-integrity vulnerability.
However, the API and query layers still model an unreachable mutation and the
UI still offers a “Promote” button. That creates a misleading affordance, dead
cache-manipulation code, and future risk that an implementer revives a dropped
cross-domain behavior. The supported curated-customer path should be explained
as static guidance without presenting a fake action.

---

## 7. Approaches considered and rejected

These decisions prevent later sessions from re-entering known dead ends.

1. **Rejected: authorize Opportunity Chat with “valid JWT” only.**
   That is the current defect because all POP apps share Supabase Auth.

2. **Rejected: trust the frontend's `user.roles` or send a `crmAccess` boolean
   in the chat request.**
   Browser claims are mutable. Authorization must be resolved server-side from
   the verified token/user identity.

3. **Rejected: keep webhook fail-open for local convenience.**
   Local convenience cannot turn a production service-role endpoint public.
   Tests must inject a known test secret; startup without a real secret must
   fail loudly.

4. **Rejected: only increase Graph `$top` or the lookback window.**
   Any fixed cap can still lose a sufficiently large burst. The permanent
   design is a persisted delta cursor; paging all results is the migration
   bridge.

5. **Rejected: replace Overview's unlimited reads with arbitrary limits such
   as 50/100/300.**
   A prior 2026-06-22 refactor did this and made production screens display
   incomplete data as if it were complete. Counts must remain exact through
   server contracts; activity lists must be explicitly labeled/reasoned recent
   feeds.

6. **Rejected: add SQL or migrations inside `popcrm-web/shared-db/`.**
   That folder is an auto-synced read-only vendor mirror. New API contracts are
   authored in `/worksp/shared-db/supabase/migrations/`.

7. **Rejected: direct SQL/dashboard changes in production.**
   Shared backend changes are branch + PR, preview apply/verification first,
   production apply, merge, and then app code.

8. **Rejected: buffer the entire HTTP body and check its length afterward.**
   Memory has already been consumed by then. The reader must stop/destroy the
   request as soon as the configured limit is crossed.

9. **Rejected: use `Promise.race` without aborting fetch.**
   That times out the caller while leaving sockets and upstream work alive.
   Use `AbortSignal.timeout` or an `AbortController`.

10. **Rejected: run `npm audit fix --force` without reviewing the dependency
    graph.**
    It may downgrade `shadcn` or introduce breaking majors. Upgrade direct
    dependencies intentionally and remove unused tooling.

11. **Rejected: leave `shadcn` as a shipped dependency merely because
    `src/components/ui` originated from shadcn.**
    Hand-maintained UI source does not require the CLI at runtime.

12. **Rejected: silence the React lint rule at `App.tsx:48`.**
    The state can be initialized correctly without an effect-driven render.

13. **Rejected: solve the auth race with a fixed delay.**
    Timing delays are nondeterministic. Use request identity/generation and
    verify the current session before applying results.

14. **Rejected: depend on the unreachable malformed workflow tail remaining
    harmless.**
    Bash parses the whole block before execution, so the unmatched `fi` makes
    the step invalid regardless of the earlier `exit`; syntax tooling already
    proves the failure.

15. **Rejected: raise the worker `.limit(100000)` caps.**
    A larger cap increases load without guaranteeing completeness. Stable
    keyset batching/checkpoints and idempotent processing are required.

16. **Rejected: parallelize every per-row worker call with unbounded
    `Promise.all`.**
    That trades serial slowness for connection/database exhaustion. Use bulk
    operations where possible and small configurable concurrency otherwise.

17. **Rejected: keep the disabled Promote button as documentation.**
    Disabled or error-only controls teach users that a workflow almost exists.
    Replace it with non-actionable explanatory text/help linked to the curated
    customer workflow and remove the dead mutation surface.

---

## 8. Design decisions

Decisions below are locked as of 2026-07-26 unless repository ground truth has
changed. If it has, stop and document the conflict.

### Locked

- Each numbered remediation session is a fresh context window and lands a
  focused commit on app `main` before the next begins.
- Any unrelated dirty or untracked files found at execution time belong to
  another user/session and must remain untouched/uncommitted.
- Production/shared cloud is read-only to ordinary sessions unless Albert
  explicitly authorizes the exact mutation in the current chat. The
  shared-db workflow's preview/production apply step must follow the
  permissions available in that session; if production apply authority is not
  explicit, stop at the reviewed/preview-proven gate and request it.
- Browser code never receives a service-role key.
- Opportunity Chat authorization is server-authoritative and requires CRM
  access or administrator status.
- The webhook secret is mandatory for `fireflies-server`.
- HTTP body limits and upstream timeouts are configurable with safe defaults,
  validated as positive finite integers, and invalid values fail startup.
- Outlook's final state uses a persisted Microsoft Graph delta cursor; no
  fixed-count lookback is accepted as the permanent result.
- Overview exact totals and recent activity are separate server concepts.
- New Supabase functions/views/RPCs live in canonical shared-db, use
  `app.has_app_access('crm')`, and expose only columns the UI needs.
- CI must run tests before image build.
- Dependency remediation may use supported patch/minor upgrades. Recharts 3 is
  a deliberate major migration and requires visual verification.
- No lint suppressions are accepted for the two known frontend issues.
- High-volume worker processing uses deterministic keyset ordering with an ID
  tie-breaker, bounded batch sizes, idempotent writes, and explicit progress;
  no fixed row cap may masquerade as complete processing.
- Ingested domains remain CRM-private triage evidence and are never promoted or
  linked to `core.customer`; the dead promotion mutation will be removed.

### Open judgment, with criteria

- **Worker module layout:** Session 1 may extract small modules under
  `workers/lib/` or add exported helpers plus a robust main-module guard. Choose
  the smallest structure that lets tests import helpers without requiring real
  secrets or executing commands.
- **Chat access lookup:** Prefer checking active `app.profile` +
  `app.app_access`/administrator role by verified `auth_user_id` through a
  narrowly tested server-side helper. If direct service-role table access is
  awkward, a canonical shared-db security-definer RPC may be added, but that
  changes Session 2 into shared-db work and must follow the shared-db gate.
- **HTTP size defaults:** Start with 64 KiB for Opportunity Chat and 1 MiB for
  Fireflies unless captured real payload sizes prove Fireflies needs more.
  Keep both configurable separately.
- **Timeout defaults:** Start with 15 seconds for token/API calls and 60 seconds
  for AI completions; systemd one-shots should have a maximum compatible with
  their expected batch duration. Measure existing job duration before choosing
  systemd limits.
- **Stats contract shape:** One `api.crm_overview_snapshot()` JSON/RPC or
  separate count/recent RPCs are both acceptable. Prefer typed relational
  returns and independent failure tolerance if one count is expensive.
- **Audit target:** “No high/critical production-app advisories” is mandatory.
  A non-exploitable development-only advisory may remain only with a written
  rationale and follow-up date.

---

## 9. Implementation plan — fifteen separate sessions

### Progress ledger

Each session updates only its own row from `pending` to `complete`, adds its
commit SHA and verification evidence, and preserves later rows.

| Session | Finding | Status | Commit/evidence |
|---|---|---|---|
| 1 | Testable worker foundation / coverage gap | complete | App commit `ccf9565` pushed to `main`; 4 files/17 Vitest tests, lint (only pre-existing `src/App.tsx:48` warning), build, worker/helper syntax, import-only/no-env smoke, CLI required-env smoke, and `git diff --check` passed. Kimi K3's one finding was fixed. On 2026-07-27, after exact owner authorization, production checkout `c0dca01` was verified to contain worker commit `ccf9565`; `popcrm-fireflies` (bind mount `/worksp/popcrm-web` → `/app`) was restarted, logged `fireflies-server (supabase) listening on 8787`, and `https://crm-fireflies.designflow.app/health` returned `{"ok":true}`. All five `popcrm-*` timers were active/waiting and will load the current worker file on their next runs. |
| 2 | Opportunity Chat CRM authorization | code complete / rollout pending | App commit `4c66402` pushed to `main`; Kimi K3 initially found public leakage of profile/RPC error detail plus two test gaps, the same implementation agent fixed all three, and K3 returned `APPROVE`. 5 files/30 Vitest tests, lint (only pre-existing `src/App.tsx:48` warning), build, worker/helper syntax, and `git diff --check` passed. Shared-db guard and Build and Deploy run `30300857606` passed, including frontend live-SHA verification. No shared-db change was needed. Production `popcrm-fireflies` has not been restarted on `4c66402`, and authenticated 401/403/200 runtime behavior has not yet been verified; exact authorization for this new production worker rollout is still required. |
| 3 | Mandatory Fireflies signature configuration | pending | — |
| 4 | Bounded HTTP request bodies | pending | — |
| 5 | External and systemd timeouts | pending | — |
| 6 | Durable Outlook Graph ingestion | pending | — |
| 7A | Shared-db Overview/sidebar aggregate contracts (preview-proven) | pending | — |
| 7B | Frontend integration after authorized merge/vendor sync | pending | — |
| 8 | Dependency and Recharts remediation | pending | — |
| 9 | Deployment shell cleanup | pending | — |
| 10 | Auth refresh race | pending | — |
| 11 | CI executes tests | pending | — |
| 12 | Auth callback lint/performance warning | pending | — |
| 13 | High-volume worker batching and N+1 removal | pending | — |
| 14 | Remove retired ingested-domain promotion residue | pending | — |

Every session is a natural fresh-context cut. Before starting Session N:

1. Re-read all remaining sessions for drift.
2. Pull `origin/main`.
3. Run `git status --short --branch` in `/worksp/popcrm-web`.
4. If the session may touch schema, API contracts, generated database types,
   or cross-app data contracts, also run `git status --short --branch` in
   `/worksp/shared-db`; stop if it has unrelated dirty work.
5. Confirm earlier ledger rows are complete and any required handoff/PR/vendor
   sync evidence exists.
6. Run the baseline checks.

### Session 1 — Create a testable worker foundation

**Finding owned:** Critical worker behavior has effectively no automated
coverage. This session creates seams; it does not change production semantics.

**Files:**

- `workers/crm-worker-supabase.mjs`
- new focused modules under `workers/lib/` if selected
- new `workers/*.test.mjs` or `workers/**/*.test.mjs`
- `vitest.config.ts`
- `workers/README.md`
- `package.json` only if a dedicated worker test script helps

**Work:**

1. Separate import-safe logic from process startup. Importing a helper in Vitest
   must not require `SUPABASE_URL`, read `/home/ai/.crm-worker.env`, create a
   service client, bind a port, or dispatch a command.
2. Preserve the existing CLI commands and their exact systemd entry point.
3. Introduce injectable boundaries for:
   - Supabase auth/access lookup;
   - request-body reading;
   - signature validation;
   - `fetch`;
   - Graph page/cursor storage;
   - current time where lookbacks remain during migration.
4. Add baseline characterization tests for currently correct pure helpers:
   subject normalization, signature success/failure with an explicit secret,
   routing-improvement ordering, and address/domain normalization.
5. Ensure tests never read `.env`, never hit Supabase/Graph/OpenRouter/
   Fireflies, and never print secrets.

**Dependencies:** None. All worker remediation sessions depend on this.

**Verification gate — you'll know it worked when:**

```bash
npm test
npm run lint
npm run build
node --check workers/crm-worker-supabase.mjs
node workers/crm-worker-supabase.mjs 2>&1 | rg 'SUPABASE_URL|Usage'
```

The exact CLI smoke result may be the existing required-env error or usage
message depending on the chosen startup ordering, but it must be intentional,
documented, and must not bind a server. Import-only tests must prove no startup
side effects.

### Session 2 — Enforce CRM authorization on Opportunity Chat

**Finding owned:** Any valid shared-Supabase user can reach service-role CRM
reads.

**Files:**

- worker authorization module created in Session 1
- `workers/crm-worker-supabase.mjs`
- worker authorization tests
- `workers/README.md`
- `docs/architecture.md`
- canonical `/worksp/shared-db` only if a new access-check RPC is genuinely
  required

**Work:**

1. Keep bearer-token verification with `sb.auth.getUser(token)`.
2. Resolve the verified user's active profile and require either unrevoked CRM
   app access or administrator role. Never trust request payload claims.
3. Return:
   - `401` for missing/invalid/expired tokens;
   - `403` for authenticated users without CRM access;
   - `200` only after authorization and successful chat;
   - a non-sensitive `4xx` for malformed opportunity ID/question.
4. Do not reveal whether a specific opportunity exists to unauthorized users.
5. Log denied access with safe user/resource identifiers, not JWTs or email
   content.
6. If an RPC is required, create it in `/worksp/shared-db` on a dedicated
   branch, add migration tests/documentation, prove preview first, apply per
   authority, merge, wait for vendor sync, then update the worker.

**Dependencies:** Session 1.

**Verification gate — you'll know it worked when:**

- Unit tests named for missing token, invalid token, non-CRM valid user,
  administrator, CRM-granted user, revoked access, and inactive profile pass.
- A mocked CRM read asserts it is never called for `401`/`403`.
- An authenticated live test, if appropriate access identities exist, returns
  `403` for a non-CRM user and `200` for the 1Password CRM test login.
- `npm test`, lint, build, and worker syntax all pass.

### Session 3 — Make Fireflies signature configuration fail closed

**Finding owned:** Missing `FIREFLIES_WEBHOOK_SECRET` accepts all signatures.

**Files:**

- worker config/signature module
- `workers/crm-worker-supabase.mjs`
- signature/config tests
- `workers/README.md`
- `docs/configuration.md` if worker configuration is documented there
- `docs/deployment.md`

**Work:**

1. Validate required environment by command. `fireflies-server` must require
   `FIREFLIES_WEBHOOK_SECRET`, `FIREFLIES_API_KEY`, Supabase URL/key, and any
   other secrets actually needed by enabled endpoints.
2. Missing or blank webhook secret must exit non-zero before `server.listen`.
3. `isValidFirefliesSignature` must return false for missing secret/signature;
   use constant-time byte comparison where lengths match.
4. Preserve accepted Fireflies signature header formats verified by current
   integration (`sha256=<hex>` and plain hex only if both are genuinely used).
5. Do not rotate or change the stored secret. The active configuration lives in
   1Password item `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env`
   in vault `vibe_coding`.

**Dependencies:** Sessions 1-2.

**Verification gate — you'll know it worked when:**

- Startup-config tests prove missing/blank secret prevents listen.
- Signature tests cover correct body, modified body, missing header, wrong
  secret, malformed hex, and both supported header forms.
- Existing webhook behavior tests remain green.
- No real secret appears in output, fixtures, or commits.

### Session 4 — Bound public HTTP request bodies

**Finding owned:** Opportunity Chat and Fireflies buffer unlimited bytes.

**Files:**

- worker HTTP helper module
- `workers/crm-worker-supabase.mjs`
- HTTP body-limit tests
- `workers/README.md`
- `docs/configuration.md`

**Work:**

1. Replace duplicate chunk-collection blocks with one `readJsonBody(req, opts)`
   helper that:
   - counts raw bytes;
   - rejects immediately and stops consuming/destroys the stream at the limit;
   - distinguishes `413 payload_too_large` from `400 invalid_json`;
   - handles aborted/erroring requests once;
   - never logs full bodies.
2. Add configurable positive integer limits, proposed defaults:
   `OPPORTUNITY_CHAT_MAX_BODY_BYTES=65536` and
   `FIREFLIES_MAX_BODY_BYTES=1048576`.
3. Validate configuration at startup. Invalid/nonpositive values fail loudly.
4. Keep signature calculation over the exact raw Fireflies body before JSON
   parsing.

**Dependencies:** Sessions 1-3.

**Verification gate — you'll know it worked when:**

- Tests cover exactly-at-limit, one-byte-over, chunked-over-limit, invalid JSON,
  aborted request, and valid request for both routes.
- Spies prove route handlers and paid APIs are not called after `400`/`413`.
- A local server smoke request receives 413 without process growth or crash.

### Session 5 — Add bounded upstream and systemd execution time

**Finding owned:** Fetches and scheduled services can hang indefinitely.

**Files:**

- worker fetch/timeout helper module
- `workers/crm-worker-supabase.mjs`
- worker timeout/retry tests
- `systemd/popcrm-*.service`
- `workers/README.md`
- `docs/deployment.md`
- `docs/configuration.md`

**Work:**

1. Route Graph token/messages, OpenRouter, and Fireflies fetches through a
   helper using `AbortSignal.timeout` or an AbortController that truly cancels
   I/O.
2. Use configurable timeouts by operation class, with validated defaults.
3. Retry only idempotent transient failures (`408`, `429`, selected `5xx`,
   network reset/timeout), with capped exponential backoff and jitter. Do not
   retry auth/signature/validation failures or duplicate non-idempotent writes.
4. Make exhausted retries fail loudly with operation name, attempt count, and
   safe HTTP status; never include tokens or message bodies.
5. Measure or inspect current systemd job durations read-only, then add
   appropriate `TimeoutStartSec` and optionally runtime hardening that does not
   break required network/read access. Do not deploy/restart production units
   without exact authority.

**Dependencies:** Sessions 1-4.

**Verification gate — you'll know it worked when:**

- Fake-timer tests cover cancellation, transient retry, retry cap, 401 no
  retry, and successful retry.
- `systemd-analyze verify systemd/popcrm-*.service
  systemd/popcrm-*.timer` passes where systemd tooling is available.
- One-shot local mocks terminate within their configured time.
- `npm test`, lint, build, and worker syntax pass.

### Session 6 — Make Outlook ingestion durable and complete

**Finding owned:** Newest-50 lookback can permanently skip messages.

**Files:**

- worker Graph-ingest module
- `workers/crm-worker-supabase.mjs`
- Graph pagination/delta tests
- `workers/README.md`
- `docs/architecture.md`
- `docs/configuration.md`
- canonical `/worksp/shared-db` if durable cursor storage needs a CRM table/RPC

**Work:**

1. First implement page traversal that follows Graph `@odata.nextLink` and
   validates every next link remains on the Microsoft Graph HTTPS host.
2. Implement the permanent delta-query flow for the mailbox:
   - initial sync pages to completion;
   - persist `@odata.deltaLink` only after all pages are processed;
   - resume from the committed delta link;
   - handle token invalidation with an explicit, alerted resync path;
   - preserve idempotency using `outlook_message_id`;
   - do not advance the cursor past a failed page/message.
3. Store the cursor durably. Preferred location is a CRM-owned worker-state
   table or narrow API RPC in shared-db; do not use a local file inside the
   ephemeral application container and do not overload unrelated metadata.
4. If schema is required, follow the full shared-db branch/PR/preview-first
   procedure before app code.
5. Retain a configurable safety reconciliation window only as a recovery check,
   not the primary cursor.
6. Preserve unknown-domain routing and opportunity-summary behavior.

**Dependencies:** Sessions 1 and 5. Session 7A is independent of this after
Session 5, but execution remains serial.

**Verification gate — you'll know it worked when:**

- Tests simulate 125 messages across three pages and assert all 125 are handled.
- Tests simulate a crash on page two and prove the durable cursor is not
  advanced.
- Tests simulate duplicates, empty delta, deleted/tombstone entries, expired
  delta token, malicious next link, Graph 429, and restart/resume.
- A preview-backed one-shot run reports fetched/created/duplicate counts and a
  second run is idempotent.
- No production apply/run occurs without explicit authority.

### Session 7A — Create preview-proven server aggregate contracts

**Finding owned:** Overview/sidebar repeatedly download complete datasets.

**Repository and files:**

- canonical `/worksp/shared-db`
  - `AGENTS.md`
  - new timestamped migration under `supabase/migrations/`
  - relevant tests/docs

**Work:**

1. Inventory every exact number/chart/activity row used by Sidebar and Overview:
   customer/contact totals, open opportunities, email routing-status counts,
   12-week email series, meeting count/recent meetings, open tasks, pending
   approvals, pipeline-stage counts, recent unrouted emails.
2. Design purpose-specific, browser-safe `api.crm_*` aggregate/recent contracts:
   - exact counts computed server-side;
   - bounded recent rows;
   - deterministic ordering with ID tie-breakers;
   - `app.has_app_access('crm')` authorization;
   - only necessary columns;
   - independently failure-tolerant groups where feasible.
3. Prove query plans with representative preview data using
   `EXPLAIN (ANALYZE, BUFFERS)` and add query-shaped indexes only when evidence
   requires them.
4. Shared-db sequence:
   - inspect dirty state/in-flight PRs;
   - create a dedicated branch;
   - add an additive/idempotent timestamped migration;
   - run `scripts/check-sql.sh` and repository tests;
   - preview dry-run/apply/verification;
   - open/update the shared-db PR with SQL, test, EXPLAIN, access-control, and
     preview evidence;
   - stop at the preview-proven gate unless Albert explicitly authorizes the
     exact production apply/merge action in that implementation session.
5. Record the branch, PR URL, migration filename, preview project, preview apply
   status, production apply status, and the exact next action in both the
   shared-db handoff and this plan's ledger. Do not mark Session 7A complete
   until the shared-db change is merged under the repository's authorized
   workflow; use `preview complete / merge pending` when authority is absent.

**Dependencies:** Sessions 1-6 complete. This is the only mandatory shared-db
phase.

**Verification gate — you'll know it worked when:**

- Shared-db preview contracts deny a valid non-CRM user and return correct data
  for a CRM user.
- Contract counts match direct preview SQL fixtures.
- EXPLAIN evidence is saved in shared-db verification docs.
- `scripts/check-sql.sh` and all shared-db repository checks pass.
- The shared-db worktree has no untracked migration or unexplained file.
- The PR/preview evidence is durable; no production apply or merge was inferred
  from this plan.

### Session 7B — Integrate the merged aggregate contracts in the frontend

**Finding owned:** Same stats-load finding as Session 7A, app-side half.

**Files:**

- `src/lib/database.types.ts`
- `src/lib/types.ts`
- `src/features/crm/api.ts`
- `src/features/crm/queries.ts`
- `src/components/app/AppSidebar.tsx`
- `src/features/crm/pages/OverviewPage.tsx`
- focused API/adapter/component tests
- `docs/architecture.md`
- vendored `shared-db/` only through the repository's automated sync

**Work:**

1. Start only after the shared-db PR is owner/AI-authorized, merged, applied as
   required, and the generated vendor sync is available on app `main`. If any
   of those facts is missing, stop and leave Session 7B pending.
2. Regenerate `src/lib/database.types.ts` through the canonical shared-db type
   workflow; do not hand-invent generated types.
3. Replace `useCrmStatsQuery`'s seven full fetches with typed snapshot/recent
   queries. Ensure Sidebar and Overview share cache keys instead of duplicating
   network calls.
4. Preserve exact displayed totals and explicitly label recent-only activity.
5. Remove obsolete unlimited stats-only fetch usage, but do not change other
   page-specific list behavior in this session.

**Dependencies:** Session 7A merged/applied/vendor-synced under its own
authorization gate.

**Verification gate — you'll know it worked when:**

- Browser network inspection on Overview shows only aggregate/bounded recent
  calls—no unbounded customer/contact/opportunity/email/meeting/task/approval
  list calls.
- Sidebar and Overview values match the production baseline on the same data.
- `npm test`, lint, build pass.
- Serve locally and capture desktop/mobile screenshots of Overview and sidebar.

### Session 8 — Remediate dependencies and migrate Recharts

**Finding owned:** Known advisories, misplaced CLI dependency, and unsupported
Recharts 2.

**Files:**

- `package.json`
- `package-lock.json`
- chart components under `src/components/app/`
- any affected generated-style chart primitive only if required
- chart/component tests
- `docs/development.md`
- Core modification inventory in `AGENTS.md` if a base primitive changes

**Work:**

1. Re-run `npm audit --json` at session start; advisories are time-sensitive.
2. Verify `shadcn` has no runtime imports with `rg`. Remove it if unused;
   otherwise move it to `devDependencies` and document the actual command.
3. Upgrade Vitest to a fixed compatible release and React Router to the latest
   supported fixed release. Check official migration notes before changing
   behavior.
4. Upgrade Recharts from 2.15.4 to maintained v3, following official migration
   documentation. Verify `ChartDonut`, `ChartHBar`, `ChartAreaVolume`, and
   Overview rendering/data/tooltip semantics.
5. Update Vite/PostCSS and transitive packages through supported direct
   dependency versions. Do not add broad `overrides` unless the upstream package
   cannot yet resolve the advisory and the override is proven compatible.
6. Classify remaining advisories by shipped runtime, build-only, and
   unreachable CLI path. No high/critical shipped-app advisory may remain.
7. Record any justified residual advisory, upstream issue/version, exposure
   analysis, and review date in `docs/development.md`.

**Dependencies:** Session 7B so its chart/data changes are already stable.

**Verification gate — you'll know it worked when:**

```bash
npm ci
npm audit --omit=dev
npm audit
npm test
npm run lint
npm run build
```

Additionally, serve the app and capture Overview screenshots at desktop and
mobile widths. Compare chart labels, colors, tooltips, empty states, and console
errors. Production audit must have no high/critical advisory; any development
residual must have the documented rationale.

### Session 9 — Remove malformed deployment shell remnants

**Finding owned:** Unreachable unmatched `fi`/loop tail remains in deploy script.

**Files:**

- `.github/workflows/deploy.yml`
- optional workflow shell test/script
- `docs/deployment.md` only if behavior changes (expected N/A)

**Work:**

1. Remove only the unreachable lines after the real failure `exit 1`.
2. Extract or validate every multiline shell block with `bash -n`.
3. Add a lightweight workflow syntax gate if the repository can do so without
   circularly depending on the broken workflow. At minimum document the local
   validation command.
4. Do not alter the successful commit-aware bundle verification algorithm.

**Dependencies:** Sessions 1-8. This must precede Session 11 so Session 11 can
require whole-workflow shell validation without inheriting a known syntax
defect.

**Verification gate — you'll know it worked when:**

- Extracted shell blocks pass `bash -n`.
- YAML/actionlint validation passes.
- The next GitHub Build and Deploy run completes verify, image, deploy, and
  exact-SHA check.

### Session 10 — Prevent stale auth refreshes after logout

**Finding owned:** Overlapping `refresh()` calls can restore obsolete user
state.

**Files:**

- `src/auth/auth.tsx`
- new `src/auth/auth.test.tsx` or extracted auth-state helper tests
- test setup only as needed
- `docs/architecture.md`

**Work:**

1. Add deterministic stale-result suppression using a monotonically increasing
   refresh generation/request ID and active-provider guard.
2. Before applying a profile result, confirm it is still the newest refresh and
   belongs to the current Supabase session user.
3. On `SIGNED_OUT`, invalidate earlier generations synchronously and clear real
   user/impersonation state.
4. Ensure provider unmount prevents all state updates.
5. Preserve the intentional fallback that keeps a valid authenticated session
   usable when `current_user_profile` fails, but log/report the degraded profile
   contract rather than silently hiding it if current error conventions require.
6. Preserve admin-only impersonation and clear it when the real account loses
   admin status or signs out.

**Dependencies:** Sessions 1-9. The tests added here become a deployment gate
when Session 11 adds the explicit CI test step.

**Verification gate — you'll know it worked when:**

- Controlled-promise tests reproduce:
  - slow sign-in profile response followed by sign-out;
  - user A refresh followed by user B sign-in;
  - token refresh bursts resolving out of order;
  - provider unmount during refresh;
  - profile RPC failure with still-valid session.
- In every stale case, obsolete results do not change rendered user.
- `npm test`, lint, and build pass.

### Session 11 — Make tests a deployment gate

**Finding owned:** GitHub Actions does not execute Vitest.

**Files:**

- `.github/workflows/deploy.yml`
- `docs/deployment.md`
- `docs/development.md`
- optionally `package.json` if a single `check` script is introduced

**Work:**

1. Add a named test step after `npm ci` and before build/image publication.
2. Keep lint and typecheck/build explicit so the Actions UI shows which gate
   failed.
3. Use `npm test`/`vitest run`, never watch mode.
4. Update deployment documentation's verify stage.
5. Do not weaken or skip tests for docs/code paths; existing workflow
   `paths-ignore` behavior may remain.

**Dependencies:** Sessions 1-10. Session 9 has already made the workflow shell
syntactically clean, so whole-workflow validation is now a valid gate.

**Verification gate — you'll know it worked when:**

- Local `npm ci && npm test && npm run lint && npm run build` passes.
- `actionlint` passes if installed; otherwise validate YAML and all shell blocks
  with available tooling.
- Push a focused commit and inspect the GitHub run: a visible `Test` step runs
  and passes before `build-and-push`.
- The deployed SHA matches the commit if the workflow triggers a deployment.

### Session 12 — Remove the auth callback effect/set-state warning

**Finding owned:** `Gate` synchronously calls `setAuthError` in an effect.

**Files:**

- `src/App.tsx`
- new focused App/auth-callback tests
- `AGENTS.md`
- no other UI files unless tests require setup

**Work:**

1. Initialize auth error state lazily from `readAuthCallbackError`.
2. Keep URL sanitization in an effect only when callback error parameters were
   present; remove query/hash auth error material without dropping unrelated
   route information unnecessarily.
3. Ensure the raw provider error remains safely rendered as text, never HTML.
4. Preserve the special `unexpected_failure`/“saving new user” friendly message,
   dismiss behavior, signed-out login display, signed-in routes, and loading
   state.
5. Do not suppress `react-hooks/set-state-in-effect`.
6. Reconcile the stale lint-baseline wording in `AGENTS.md` with the actual
   clean result. Do not preserve historical “accepted warnings” after the
   underlying warnings no longer exist.

**Dependencies:** Session 10 because both touch auth behavior and tests.

**Verification gate — you'll know it worked when:**

- Tests cover query error, hash error, special provisioning error, no error,
  dismiss, and URL cleanup.
- `npm run lint` reports zero warnings.
- `npm test` and `npm run build` pass.
- Local browser verification confirms the banner and dismiss button at desktop
  and mobile widths.

### Session 13 — Make high-volume worker jobs incremental and bounded

**Finding owned:** Reroute, contact sync, summary refresh, and ignore-rule
commands repeatedly scan fixed sets of up to 100,000 rows and issue avoidable
serial per-row queries/updates.

**Files and repositories:**

- worker batch/query modules created in Session 1
- `workers/crm-worker-supabase.mjs`
- worker batching/checkpoint tests
- `workers/README.md`
- `docs/architecture.md`
- `docs/configuration.md`
- canonical `/worksp/shared-db` only if durable checkpoints or purpose-built
  batch RPCs/indexes are required

**Work:**

1. Inventory each command's real eligibility rule, current ordering, idempotency
   key, and definition of successful completion:
   - `reroute`: only records still eligible for routing improvement;
   - `contact-sync`: only email/contact evidence not already reconciled;
   - `summarize`: only opportunities whose source activity is newer than the
     stored summary state;
   - `apply-ignore-rules`: only currently unrouted messages not already
     evaluated under the current rule set.
2. Replace fixed `.limit(100000)` reads with deterministic keyset batches using
   a unique ID tie-breaker. A batch is complete only when the query returns no
   more eligible rows; a failed batch must be retryable without skipping rows.
3. Prefer purpose-built server-side selection/bulk-update RPCs where they reduce
   round trips and can preserve authorization/idempotency. Any new RPC, table,
   column, trigger, or index belongs in canonical `/worksp/shared-db` under the
   branch/PR/preview-first gate.
4. Remove N+1 lookup patterns by preloading/bulk-fetching customer domains,
   contacts, opportunity IDs, and ignore rules per batch. Where a paid AI call
   or per-row write cannot be bulked, use small configurable concurrency with
   retry/backoff from Session 5 and never unbounded `Promise.all`.
5. Emit structured per-run evidence: batches processed, eligible rows,
   succeeded, skipped/idempotent, failed, duration, and last safe cursor. A
   partial failure must exit non-zero after preserving retryability.
6. Keep job schedules and business routing semantics unchanged unless measured
   duration proves a schedule conflict; schedule changes require explicit
   documentation and operational review.
7. Measure preview query plans and execution counts. Add query-shaped indexes
   only with representative `EXPLAIN (ANALYZE, BUFFERS)` evidence in
   shared-db.

**Dependencies:** Sessions 1, 5, and 6. Execute after Session 12 in this serial
plan so the full test/CI foundation is already available.

**Verification gate — you'll know it worked when:**

- Tests process more than one batch and prove every eligible row is reached
  exactly once despite equal timestamps.
- A forced middle-batch failure followed by restart processes the remaining
  rows without gaps or duplicate side effects.
- Tests prove concurrency never exceeds its configured bound.
- Query spies show customer/contact/rule lookups are per batch rather than per
  row.
- A preview one-shot reports bounded batches and a second run is idempotent or
  processes only genuinely new/changed work.
- `npm test`, lint, build, worker syntax, and applicable shared-db checks pass.
- No production worker rollout occurs without the Section 12 authority gate.

### Session 14 — Remove retired ingested-domain promotion residue

**Finding owned:** The app still exposes an error-only promotion affordance and
dead optimistic mutation for an operation that the architecture forbids.

**Files:**

- `src/features/crm/api.ts`
- `src/features/crm/queries.ts`
- `src/features/crm/pages/CustomersPage.tsx`
- `src/features/crm/pages/CustomersPage.test.tsx` or the focused page/helper
  test location established by prior sessions
- `src/lib/types.ts` only if promotion-only fields are genuinely unused
- `AGENTS.md` and `docs/architecture.md` to reconcile wording

**Work:**

1. Prove with `rg` that `promoteIngestedDomain` and
   `usePromoteIngestedDomainMutation` have no valid caller outside the
   error-only path.
2. Remove the always-throwing API function, optimistic mutation, imports, cache
   invalidations, `promoteDomain` handler, Upload icon, and Promote table
   action.
3. Preserve the triage table and its evidence fields. Replace the action column
   only if necessary with concise non-interactive guidance such as “Create a
   curated customer separately”; do not imply that the domain row will be
   linked or converted.
4. Do not remove `promoted_customer_id`/historical display fields merely because
   new promotion is forbidden. Keep them when existing data/contracts use them
   for history; remove them only after backend/data evidence proves they are
   obsolete and no migration is required.
5. Update durable documentation so it consistently says ingested domains remain
   CRM-private triage evidence and customer creation uses the normal curated
   workflow. Do not create or restore a database promotion RPC.
6. Visually verify Customers → Triage at desktop and mobile widths, including
   empty/loading/error states and long domain/subject values.

**Dependencies:** Sessions 1-13. No shared-db change is expected.

**Verification gate — you'll know it worked when:**

- `rg -n "promoteIngestedDomain|usePromoteIngestedDomainMutation|Promote is unavailable"`
  returns no project-owned source matches.
- A focused test proves the Triage table has no Promote button and preserves
  domain evidence/status rendering.
- `npm test`, lint, and build pass.
- Desktop/mobile screenshots show a clear triage experience with no fake
  action.

---

## 10. Tests required

The per-session gates above are mandatory. The final suite must include these
named behavioral groups, regardless of exact filenames:

Worker/frontend unit tests should use Vitest `vi.fn()`/`vi.mock()`, controlled
promises, fake timers where time matters, and in-memory/request-stream doubles.
They must assert exact call counts and negative behavior (for example, denied
requests never reach service-role reads, aborted requests never invoke paid
APIs, and batch concurrency never exceeds its limit). Keep extraction limited
to the pure helpers and injected I/O seams needed for these tests; do not turn
testability into a full worker rewrite. Tests must not read real environment
files, contact external services, or emit secrets.

### Worker security

- `opportunity chat rejects missing token`
- `opportunity chat rejects invalid token`
- `opportunity chat forbids valid user without crm access`
- `opportunity chat allows active crm user`
- `opportunity chat allows administrator`
- `denied chat never invokes service-role crm reads`
- `fireflies startup rejects missing webhook secret`
- `fireflies signature rejects missing, malformed, and mismatched signatures`
- `fireflies signature accepts exact signed raw body`

### Worker resource safety

- `request reader accepts exact byte limit`
- `request reader rejects one byte over limit before route execution`
- `request reader reports invalid JSON`
- `request reader handles aborted stream once`
- `timed fetch aborts underlying request`
- `timed fetch retries only transient idempotent failures`
- `timed fetch does not retry authentication failure`

### Outlook durability

- `graph ingestion follows all next links`
- `graph ingestion processes more than fifty messages`
- `graph cursor advances only after complete successful batch`
- `graph cursor resumes after process restart`
- `graph ingestion is idempotent by outlook message id`
- `graph ingestion rejects off-host next link`
- `expired delta cursor enters explicit reconciliation path`

### Worker batching

- `reroute traverses every deterministic keyset batch`
- `contact sync bulk-loads existing contacts per batch`
- `summary refresh selects only stale opportunities`
- `ignore rules resume safely after a failed batch`
- `batch restart has no gaps or duplicate side effects`
- `worker concurrency never exceeds configured bound`

### Overview contracts

- shared-db contract access denial/allowance tests
- exact count fixture tests
- deterministic recent ordering tests with equal timestamps
- frontend response-adapter tests
- query-key sharing test for Sidebar and Overview
- Overview empty/error/partial-group behavior

### Dependencies/charts

- existing chart data transforms
- Recharts 3 renders each chart without console errors
- empty and zero-value chart states

### Auth

- stale refresh after sign-out is ignored
- stale user A refresh cannot overwrite user B
- unmount prevents update
- valid-session/profile-failure fallback
- callback error query/hash parsing and cleanup

### Retired promotion

- `customer triage renders domain evidence without a promote action`
- `customer triage guidance does not imply conversion or linkage`

### CI

The final local gate is:

```bash
npm ci
npm test
npm run lint
npm run build
node --check workers/crm-worker-supabase.mjs
git diff --check
```

The final CI gate must visibly run tests before building the image.

---

## 11. Constraints, standing rules, and gotchas

1. Albert is a business owner, not the operator for routine engineering steps.
   Do all accessible work yourself.
2. Preserve unrelated dirty/untracked files and stage only session-owned paths.
3. `popcrm-web` is main-only. State repo and branch before push.
4. Shared-db is branch + PR; database contracts land there before app code.
5. Never edit migrations already applied. Use new timestamped additive
   migrations.
6. Preview Supabase is `xjcyeuvzkhtzsheknaiu`; production is
   `qsllyeztdwjgirsysgai`. Never mix these with DAM project refs.
7. Production/shared infrastructure is read-only unless exact mutation
   authority is present in the current chat. Do not infer it from this plan.
8. Secrets live only in 1Password vault `vibe_coding`. Never copy values into
   source, tests, docs, prompts, logs, or command arguments.
9. Serialize 1Password reads. Do not fan out `op read`/`op run`.
10. Do not rotate the Fireflies secret, Supabase keys, or any credential without
    approval.
11. No direct live-server code edits or manual routine deploys.
12. No service-role credential in browser/Vite configuration.
13. No silent fallbacks. Missing security/runtime configuration must alert
    loudly.
14. No arbitrary hard-coded list caps masquerading as complete data.
15. High-volume CRM queries must follow the keyset/bounded contract documented
    in the vendored shared-db migration note named in `AGENTS.md`.
16. UI-affecting changes require local serve plus screenshots and console
    inspection.
17. Base UI primitives under `src/components/ui` are hand-maintained and use the
    repository's established import style. Avoid changing them unless Recharts
    migration requires it; document any change in `AGENTS.md`.
18. The Fireflies `/health` endpoint proves liveness only, not ingestion.
19. The deploy bundle contains the short commit SHA; verify live SHA from the
    served bundle/build stamp, not `version.json`.
20. Every session updates this plan's ledger, affected durable docs, and only
    creates `HANDOFF.md` when work remains unfinished.

---

## 12. Access and environment

### Known authenticated tooling

- `gh` is authenticated as GitHub user `u2giants`.
- `op`, `supabase`, and other CLIs are expected on Albert's machines but must be
  verified with a real read-only call in the session that needs them.
- Claude Code is installed at `/usr/bin/claude`; this plan was independently
  reviewed in planning, but implementing sessions do not need Claude unless
  requested.

### Secret locations, never values

- CRM browser test login: 1Password vault `vibe_coding`, item
  `POP CRM live test login - Codex`.
- Frontend Supabase public configuration: vault `vibe_coding`, item/reference
  documented in `docs/development.md`.
- Worker environment: vault `vibe_coding`, item
  `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env`.
- Supabase CLI token: vault `vibe_coding`, item
  `Supabase CLI Personal Access Token`.
- Shared production database password: vault `vibe_coding`, item
  `Supabase DB Password - shared POP database`.
- Preview database password: use the preview item for project
  `xjcyeuvzkhtzsheknaiu`.

### Local frontend

```bash
cd /worksp/popcrm-web
npm ci
export VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
export VITE_SUPABASE_ANON_KEY="$(op read 'op://vibe_coding/sgk6fhcjdluqvnbsekjzdkftpa/SUPABASE_ANON_KEY')"
npm run dev -- --host 0.0.0.0
```

Use 1Password injection in the shell; never place values in a tracked `.env`.

### Shared-db

```bash
cd /worksp/shared-db
git status --short --branch
gh pr list
git branch -a
```

Then follow `/worksp/shared-db/AGENTS.md` and the shared-db skill. Do not begin a
migration when unrelated dirty/in-flight database work exists.

### Worker deployment and live verification

The normal frontend pipeline does **not** deploy host worker code:

- systemd services execute
  `/worksp/popcrm-web/workers/crm-worker-supabase.mjs` from the runtime host
  checkout;
- `popcrm-fireflies` bind-mounts the host's `/worksp/popcrm-web` read-only and
  runs the same file in `fireflies-server` mode; and
- GitHub Actions builds/deploys only the static frontend image.

Therefore, `git push` does not prove Sessions 1-6 are live. Before a worker
session changes code, it must read the current host-deployment/runbook material
in `u2giants/albert-standards/infrastructure` and verify the supported automation
path. The required runtime sequence is conceptually:

1. update the host checkout to the exact reviewed `origin/main` SHA through the
   approved host-management/deployment automation;
2. run `systemctl daemon-reload` only when unit files changed;
3. restart the affected systemd service/timer or recreate/restart
   `popcrm-fireflies` through its owning automation;
4. inspect status/logs and execute the session's safe live verification; and
5. record the runtime SHA and evidence.

Those steps describe the required outcome, **not authorization to SSH, sudo,
pull, restart, or recreate anything on production**. Ordinary AI sessions remain
read-only for the production host. If the infrastructure repository has no
approved automated rollout path, or the current chat lacks exact authority:

- finish and push the reviewed code/tests;
- do not claim the worker fix is deployed;
- leave that session's ledger row `pending` (or explicitly `code complete /
  rollout pending`);
- create/update a comprehensive `HANDOFF.md` with the commit SHA, affected
  service/container, exact unperformed runtime actions, and verification command;
- request the smallest exact deployment authority or infrastructure change
  needed; and
- update `u2giants/albert-standards/infrastructure` when the durable deployment
  mechanism/runbook is established.

Never use an ad-hoc host `git pull`, direct file copy, or hand-created Docker
container as the normal worker deployment mechanism.

---

## 13. Definition of done, risks, rollback, and open questions

### Per-session done

Each session is complete only when:

- its finding has a permanent root-cause fix;
- named regression tests exist and pass;
- lint/build/worker checks appropriate to the change pass;
- UI work has screenshot/console verification;
- durable docs and this progress ledger are updated;
- only session-owned files are committed;
- commit is pushed to `u2giants/popcrm-web/main` (or shared-db branch/PR as
  prescribed);
- GitHub CI is green;
- deployment-triggering app changes are verified at the exact live SHA; and
- no mystery files, untracked migrations, unfinished shared-db PR, or secrets
  remain.

For Sessions 1-6 and 13, “complete” additionally requires the approved worker
rollout and runtime-SHA verification described in Section 12. If production
authority is absent, the code may be committed/pushed but the ledger must remain
`code complete / rollout pending` with a comprehensive `HANDOFF.md`; it is not
per-session done.

### Whole-plan done

- All fifteen ledger rows are `complete` with commit/evidence.
- Shared-db aggregate/cursor contracts, if used, are canonical, tested,
  preview-proven, appropriately applied, merged, and vendor-synced.
- Final `npm ci`, tests, lint, build, worker syntax, and git checks pass.
- `npm audit --omit=dev` has no high/critical shipped-app advisory.
- GitHub Actions visibly runs tests and deploys successfully.
- `https://crm.designflow.app` serves the final short SHA.
- Opportunity Chat authorization is live-verified.
- Fireflies health is green and a signed test/delivery is observed without
  treating health alone as ingestion proof.
- Outlook cursor state survives a restart and a second run is idempotent.
- Overview network inspection proves bounded/aggregate calls only.
- Final docs accurately describe new env vars, contracts, tests, and operations.
- `HANDOFF.md` is absent because all work is complete, or comprehensive because
  an explicitly named residual remains.

### Risks and rollback

- **Authorization lockout:** Incorrect access lookup could block real CRM users.
  Roll back the worker image/commit; never weaken to valid-JWT-only. Tests must
  prove admin and CRM-granted identities before rollout.
- **Webhook outage:** Fail-closed startup will expose missing production config.
  Verify the existing 1Password/Coolify/host env reference before deployment;
  do not invent or rotate a secret.
- **Missed/duplicate email:** Delta-cursor bugs can skip or replay mail.
  Cursor updates must be transactional/after-success and inserts idempotent.
  Roll back code while preserving cursor evidence; never delete source mail.
- **Aggregate mismatch:** A new RPC can show different totals from old arrays.
  Compare both paths on the same preview dataset before cutover and keep the old
  frontend query available for code rollback until production verification.
- **Dependency/chart regression:** Recharts 3 can alter tooltip/animation/layout
  behavior. Lockfile rollback is safe; compare screenshots before ship.
- **Worker timeout too short:** Measure jobs and choose margins; timeouts must
  alert rather than silently truncate batches.
- **Batch/checkpoint error:** A bad cursor or eligibility predicate can skip
  records or repeat paid work. Preview-prove multi-batch restart behavior,
  preserve idempotency keys, and roll back code without deleting checkpoint
  evidence until the cursor can be reconciled.

### Genuinely open questions and decision criteria

1. **Does production currently define `FIREFLIES_WEBHOOK_SECRET`?**
   Session 3 must verify metadata/existence through 1Password or safe runtime
   configuration inspection without revealing the value. If absent, stop before
   deploying fail-closed code and request permission to create/configure one;
   do not rotate an existing secret.
2. **What persistent store should own the Graph delta cursor?**
   Prefer a CRM-owned worker-state contract in shared-db. Reuse an existing
   generic integration-state table only if its ownership, RLS, uniqueness, and
   lifecycle semantics exactly fit.
3. **Which aggregate contract shape performs best?**
   Decide from preview EXPLAIN evidence and independent-failure needs, not
   preference.
4. **Which npm advisories remain by implementation time?**
   Re-run the audit; advisory data changes. Judge exposure from the actual
   dependency graph and shipped bundle.
5. **What are safe production timeout/body-size values?**
   Start from proposed defaults, measure real non-secret sizes/durations, then
   leave headroom and document the chosen values.

---

## Independent Claude Opus review

The complete 1,245-line first version of this plan was reviewed read-only by
Claude Opus at high effort on 2026-07-26. Opus inspected the plan, `AGENTS.md`,
and cited project-owned code and returned **APPROVE WITH CHANGES** with no
BLOCK-level issue, unsafe database/production instruction, or material code-fact
error.

All four review points are incorporated in this version:

1. Added Section 12's explicit worker rollout/authority gate so code push cannot
   be confused with live systemd/Fireflies deployment.
2. Moved malformed workflow-shell cleanup to Session 9, before Session 11 makes
   full workflow validation a gate.
3. Added `AGENTS.md` lint-baseline reconciliation to Session 12.
4. Corrected the Outlook citation to `PAGE_SIZE = 50` +
   `$top=${PAGE_SIZE}` and clarified that React Router remediation remains
   within major v7.

Opus's material conclusion was that the plan met the 13-section standard and was
safe/executable once the rollout and ordering corrections above were made.

---

## Independent Grok critique and integration

The reconciled plan was reviewed read-only by xAI Grok Build 0.2.112
(`grok-4.20-0309-non-reasoning`) on 2026-07-26. Grok read `AGENTS.md`, the
entire plan, and the cited project-owned files with file-read/search tools only.
It returned **APPROVE WITH CHANGES**, explicitly confirmed that all fourteen
current-code claims were accurate, and found no BLOCK-level defect.

### Accepted and integrated

1. **Split the shared-db and frontend phases.** The former Session 7 was too
   large for one fresh context and could blur the preview/authorization stop.
   It is now Session 7A (canonical shared-db through preview/PR and explicit
   authority gate) plus Session 7B (frontend only after authorized merge/apply
   and vendor sync).
2. **Make test mechanics and negative assertions explicit.** Section 10 now
   requires Vitest mocks, controlled promises/fake timers, exact call counts,
   bounded pure-helper extraction, and proof that denied/aborted paths never
   reach privileged or paid operations.
3. **Correct the promotion-risk wording.** Sections 5, 6.10, and 14 now state
   that the current throw/toast is a deliberate safe loud failure; the planned
   change removes dead mutation code and a fake affordance rather than fixing
   an active data-integrity bypass.
4. **Strengthen session startup and worker completion gates.** Section 9 now
   requires the canonical shared-db status check when a session may touch data
   contracts, and Section 13 explicitly applies worker rollout/runtime-SHA
   requirements to Session 13.

### Evaluated but not adopted

1. **Claim that the plan grants implicit production authority.** Not adopted.
   Sections 8, 11, 12, and 13 already say production/shared infrastructure is
   read-only unless Albert authorizes the exact action in the current chat.
   Session 7A was split to make this even clearer, but the critique's claim that
   the earlier wording itself granted authority was incorrect.
2. **Duplicate the complete 13-section standard inside every session.** Not
   adopted. Every implementing session is already required to read the entire
   plan and `AGENTS.md`; duplicating the standard fifteen times would increase
   drift risk and obscure session-specific instructions.
3. **Add a blanket `git revert`/Coolify rollback to every session.** Not
   adopted. Section 13 already provides risk-specific rollback. A generic
   revert is unsafe for applied database migrations and irrelevant to
   documentation-only or host-worker phases; each session must use the
   mechanism appropriate to its change.
4. **Treat Graph paging without a durable delta cursor as potentially
   permanent.** Not adopted. Paging closes the immediate 50-message truncation,
   but the business goal requires restart-safe, gap-free ingestion. The durable
   cursor remains the permanent design, with shared-db changes only if existing
   integration state cannot safely own it.
5. **Append a production live-SHA check to every verification gate.** Not
   adopted. Section 13 already requires exact live-SHA verification for
   deployment-triggering app changes. Shared-db preview work and code-complete
   but rollout-pending worker work must not claim a frontend production deploy.
6. **Narrow the Session 7 inventory further.** No change was needed: Session
   7A already enumerates only the values used by Sidebar and Overview, and
   Section 4 explicitly excludes other full-list pages.

After these judgments, Grok's material conclusion applies: the plan is safe and
zero-context executable once the accepted corrections are present.

Grok then re-read the integrated plan and `HANDOFF.md` in the same read-only
session. Its final verdict was **APPROVE**, with no remaining blocker; it
confirmed the 7A/7B authority split, test/negative-assertion detail, corrected
promotion wording, ordering, zero-context completeness, and the handoff link.

---

## Mandatory plan self-audit

### Objective checklist

- [x] All 13 required sections are present.
- [x] The ultimate goal is in plain business English at the top and says the
  goal wins over a conflicting step.
- [x] A fresh session can execute without this planning chat.
- [x] Rejected approaches and failed attempts are recorded with reasons.
- [x] Every session names concrete files/functions and has a verification gate.
- [x] Locked and open decisions are labeled.
- [x] Out-of-scope work is explicit.
- [x] Required tests are named by behavior.
- [x] Repositories, paths, URLs, project IDs, runtime ownership, and baseline
  SHAs are defined.
- [x] Secrets are referenced by vault/item only and never exposed.
- [x] Definition of done includes commit, push, CI, deploy, and live-SHA
  verification.

### Three-question audit

1. **Could a brand-new AI session with no project knowledge and no context from
   the planning conversation execute this plan to perfection without asking
   Albert anything?**
   **Yes.** Sections 2-6 establish the application, baseline, exact code
   locations, findings, and root causes. Section 9 gives each fresh session
   concrete files, behavior, dependencies, and a command/test verification
   gate. Sections 11-13 supply standing rules, access locations, landing
   requirements, rollback, and criteria for the few facts that can only be
   learned at execution time.

2. **Does the plan carry every piece of background, nuance, and reasoning held
   by the planning session, including what was ruled out and why?**
   **Yes.** Section 5 preserves working behavior and exact problem locations;
   Section 6 records the non-obvious root causes; Section 7 records seventeen
   rejected shortcuts/dead ends; Section 8 separates locked decisions from
   evidence-driven implementation judgment. Section 12 now carries the
   non-obvious split between frontend deployment and host-worker rollout.
   Sections 7A-7B carry the separate shared-db preview/authority and frontend
   integration gates. The plan records audit baseline `c17a86a`, current
   vendor-sync baseline `c217f1c`, and the evaluated Opus and Grok corrections,
   including which Grok suggestions were rejected and why.

3. **Is the ultimate goal clear enough for an implementer to make the correct
   judgment call if a prescribed step is wrong?**
   **Yes.** Section 1 defines the business outcome and explicitly makes it
   authoritative over steps. Sections 4 and 8 bound acceptable redesign, while
   Section 13 gives risk and rollback criteria. An implementer can change a
   mechanism when repository reality requires it without weakening
   authorization, durability, performance, test, or deployment outcomes.

**Self-audit result: PASS.**
