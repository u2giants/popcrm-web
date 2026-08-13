# Fresh-session handoff: audit plan Sessions 7A through 12 complete; 13 and 14 remain

Status: OPEN — Sessions 13 and 14 are the only audit work left
Created: 2026-08-13 04:10 UTC, updated 11:20 UTC
Machine: hetz
Agent: Claude (Opus 5)

## 0. DECISIONS ONLY THE OWNER CAN MAKE

1. **Allow browser localStorage injection for visual verification**, or accept
   that AI sessions cannot screenshot logged-in pages. The documented method
   (mint a Supabase session, inject it, drive Playwright) is blocked by the
   permission classifier. A credential-free workaround exists for charts only
   (`/__charts`, see §3), but nothing can screenshot the real Overview with real
   data. Everything else this session needed was granted.

### Already granted, do not re-ask

- 2026-08-13: Albert allowed AI edits to `.github/workflows/`. Sessions 9 and 11
  are done because of it.

### Already settled, do not re-ask

- 2026-08-13: Albert approved and I applied the Phase 7A production migration
  package (`20260812130000`, `20260812211000`) to `qsllyeztdwjgirsysgai`.
- The newest-500-email window is preserved on purpose. Widening it is separate
  work with its own visible-change evidence.

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM: React 19 + Vite + Supabase.

- Checkout `/worksp/popcrm-web`, GitHub `u2giants/popcrm-web`, branch `main` only
- Production `https://crm.designflow.app`, deploy = push → Actions → GHCR → Coolify
- Shared Supabase production `qsllyeztdwjgirsysgai`, preview `rjyboqwcdzcocqgmsyel`
- Canonical DB repo `u2giants/shared-db`; this repo's `shared-db/` is a read-only mirror
- Audit plan: `plan_codebase_audit_remediation.md`

## 2. What this session set out to do

Start Phase 7A of the audit plan, then take each phase through a GLM 5.2
critique, argue it to consensus, apply the agreed fixes, and continue to the
next phase autonomously.

## 3. Current state — what is done and live

### Phase 7A — server aggregate contracts. COMPLETE, in production.

Another session had already built and preview-proven the contracts (shared-db
PR #848). I inventoried every displayed value independently, reviewed the SQL
against it, recorded the immutable review evidence, and applied both migrations
to production under Albert's explicit approval.

- Review evidence run 31662213719, digest
  `sha256:818278bb38377fb313af5335ddf8e77ac7566b4fe5dbb870877026143a7025d9`
- Production apply run **31662233425**, all jobs green, catalog verification clean
- Seven contracts live: `api.crm_overview_counts`, `_email_counts`,
  `_pipeline_stages`, `_email_volume`, `_recent_unrouted`, `_recent_meetings`,
  `_pending_approvals`. Execute granted to `authenticated` only.
- Inventory: `docs/overview-aggregate-inventory.md`
- Result reported on shared-db issue #851

### Phase 7B — frontend swap. COMPLETE, deployed.

`useCrmStatsQuery`'s seven unbounded fetches are gone. Commits `5443870`,
`094275e`, `ef4c31e`. Deployed and serving by run 31664788133.

**Parity evidence, and this is the part to trust:** old client path vs new
contracts, run against production as the same authenticated CRM user,
**49 of 49 displayed values identical**. Coverage: 8 scalar KPIs, 6 donut
buckets, 8 pipeline stages, 24 chart buckets, 3 recent-row panels by row id and
order. Real numbers: Customers 152, Contacts 271, Meetings 27, emails 500,
needs-routing 472.

The old path was pulling **8,655 contact rows** plus every opportunity, meeting,
task and approval, every 90 seconds, on every Overview load.

### Phase 8 — dependencies and Recharts 3. COMPLETE, deployed.

Commits `bde0ded`, `f94fbb9`. `npm audit` and `npm audit --omit=dev` both report
**0 vulnerabilities**, down from 12 (1 critical, 7 high).

Visually verified in a real browser at 1440px and 390px via the new
credential-free probe: `npm run dev`, then `http://localhost:5173/__charts`.
Zero console errors. Source `src/dev/ChartProbe.tsx`, DEV-gated in
`src/main.tsx`; confirmed absent from the production bundle by grep.

### Sessions 9 and 11 — deploy shell and the CI test gate. COMPLETE.

Commit `70beeec`, green run `31693044569`. Removed exactly the seven orphaned
lines from `deploy.yml` (an `exit 0`, an unmatched `fi`, an unmatched `done`).
They had never gone red because bash parses lazily and the step exits on its
success path first, so the syntax error lived on a path nobody reached.

`scripts/check-workflow-shell.sh` now extracts every multi-line `run:` block and
parses it with `bash -n`. Proven against the pre-fix file: it reports the exact
failure. It fails loudly if it ever extracts zero blocks, so a broken extractor
cannot pass vacuously. It only understands `run: |`, not `run: >` or chomped
scalars — that gap is commented in the script.

The `verify` job now runs four separately named steps before any image is built:
Validate workflow shell blocks, Lint, Test, Typecheck and build. `npm test` had
never run in CI at all.

### Session 10 — stale auth refreshes. COMPLETE.

Commits `bf2e3c0` and `1cd7c4c`, green run `31694206708`. `src/auth/refreshGate.ts`
applies a profile result only if it is the newest refresh and its session user is
still current; sign-out, `logout()` and unmount reject in-flight refreshes
synchronously. A failed `current_user_profile` is still non-fatal but is logged.
Impersonation is erased when the real account is not an administrator.

GLM found the bug that mattered: StrictMode mounts, unmounts and remounts, the
cleanup disposed the gate permanently, and the ref survived the remount, so every
later refresh was rejected and the app sat signed out in development. The effect
now builds a fresh gate per run.

This is also where the repo gained a DOM test environment: `happy-dom` plus
`@testing-library/react`, opted into per file with a
`@vitest-environment happy-dom` docblock. **happy-dom, not jsdom** — jsdom 30
needs Node 22 APIs and this repo builds and deploys on Node 20.

### Session 12 — auth callback banner. COMPLETE.

Commit `948c630`, green run `31694686853`. The gate reads the callback error as
lazy state instead of setting it from an effect. `readAuthCallbackError` moved to
`src/auth/callbackError.ts` so it is testable without instantiating the Supabase
client, which throws when configuration is absent.

**`npm run lint` is now zero errors and zero warnings.** `AGENTS.md` no longer
carries an accepted-warnings row; do not reintroduce one.

## 4. Everything tried that did NOT work

### GLM's two headline defects, both wrong, and how

GLM reported that the Contacts KPI would drop and the Customers filter was
unverifiable, both because `constants.ts` exports a four-value
`CUSTOMER_STATUSES`. It does — but `src/features/crm/api.ts` never imports it.
`api.ts:36` declares its own two-value module-local constant, and that is the
binding at lines 152, 584 and 596. Shown the line, GLM withdrew both. Do not
re-derive this: two different symbols share one name in this codebase.

### My own parity harness lied to me twice before it was right

1. First run: Contacts old=77 vs new=271. Cause: PostgREST caps a plain request
   at 1000 rows and I had not paginated; the app's `fetchRows(-1)` pages through
   everything. Paginated: 271 = 271.
2. First run: different recent-meeting ids. Cause: I fetched the view unordered;
   the app orders by `date desc`. Ordered: identical.

Any future parity harness against this app must paginate and must replicate the
app's `order by`, or it will manufacture defects that do not exist.

### Editing files while a GLM review session is running

`ai-glm` snapshots `git status` and fails the turn if the tree changed. My own
concurrent edits killed a review mid-flight and marked the session failed.
Commit first, then review.

### A stuck GLM permission poisons its session permanently

When GLM requests a permission the harness cannot classify (`external_directory`
for a file outside the repo, `websearch`), the request stays queued and every
retry fails identically. `ai-glm abort` does not clear it. Only
`ai-glm delete <name>` plus a fresh `ai-glm new` works. To avoid it: copy any
outside file into the repo under `.ai/reviews/` first, and paste any external
documentation into the brief with an explicit "do not search".

### Removing `shadcn` because nothing imports it

The plan says to grep for runtime imports and remove it if unused. A TypeScript
grep says unused. It is not: `src/index.css:3` does
`@import "shadcn/tailwind.css"`, and removing the package breaks `npm run build`.
It now lives in `devDependencies`, which is safe because the Dockerfile runs a
plain `npm ci`.

## 5. Root causes and key findings

1. **`.gitignore` was silently gutting the vendored mirror.** An unanchored
   `supabase/` rule also matched `shared-db/supabase/`, so the sync bot's
   `git add -A` had been committing only 191 of 438 canonical migrations.
   Anchored to `/supabase/` in `e35b596`; the next sync backfilled to 439 on its
   own, confirmed. The leading slash is load-bearing and is commented as such.
2. **CI does not run the tests.** `.github/workflows/deploy.yml`'s `verify` job
   runs only `npm run lint` and `npm run build`. A Vitest major landed this
   session with zero CI test execution. GLM found this; I confirmed it. The fix
   is one line and is blocked with Phase 9.
3. **Independent aggregate queries need independent empty states.** Splitting
   one query into seven made the page print "Inbox zero" and "No email data yet"
   while slower queries were still loading, and permanently during an email
   outage. Each card now branches on its own query. Charts prefer stale data
   over a background-refetch error; the recent-row panels deliberately do not.
4. **`core.company` and `core.customer` are the same table**, renamed by
   `20260625153000_core_company_rename_customer.sql`. `core.company` no longer
   resolves at all. Older view definitions still name it. This closes a question
   GLM raised about a possible subset relationship: there is none.
5. **Local `npm run lint` is broken by git worktrees inside the repo.**
   `.claude/worktrees/*` gives typescript-eslint multiple candidate roots.
   Workaround: `npx eslint src --parser-options=tsconfigRootDir:/worksp/popcrm-web`.
   CI is unaffected — it checks out clean.
6. The Vitest 4 fake-timer test was checked by hand: it advances timers and then
   awaits a rejection, so a broken timer implementation would hang the test, not
   pass it silently.

## 6. Exact next steps

1. **Session 13 — high-volume worker batching and N+1 removal.** Read its section
   in the plan. Note the standing constraint from the Phase 6 handoff: the systemd
   timers execute `/worksp/popcrm-web/workers/*.mjs` **directly out of the live
   checkout**, so an uncommitted edit is already production-visible at the next
   firing. Stop the affected timer before the first edit, or work in an isolated
   worktree. The plan also says Session 13 must reuse `crm.worker_delta_cursor`
   or its compare-and-swap pattern rather than inventing another state system.
2. **Session 14 — remove retired ingested-domain promotion residue.** Last row.
3. Every session closes its own ledger row in
   `plan_codebase_audit_remediation.md` with commit SHA and evidence. Rows 1-12
   are closed; do not touch them.
4. Consider whether `src/dev/ChartProbe.tsx` stays. It is documented in
   `docs/development.md` as the way to verify a charting upgrade. If it is not
   going to be used for the next one, delete it.

## 7. Constraints and gotchas

- App repo is main-only. Never branch here.
- Shared-db work goes through a `db-work` GitHub issue and its orchestrator.
- Production DB applies need Albert's explicit per-run approval naming the exact
  package. The Phase 7A approval is spent.
- The production apply workflow needs `review_artifact_digest` in canonical
  `sha256:<64 hex>` form — the evidence job prints the bare digest, so the prefix
  must be added by hand. And shared-db `main` moves fast: record the review
  evidence and dispatch the apply back to back, or `Verify exact main commit`
  fails.
- Never leave a minted Supabase session on disk. This session's was deleted.
- Commit identity must be `Albert Hazan <u2giants@users.noreply.github.com>`.

## 8. Access and environment

- `gh` authenticated as `u2giants`; workflow dispatch and run inspection work
- `ai-glm` healthy; session `popcrm-phase8-deps-recharts` holds the Phase 8
  review, reports under `.ai/reviews/` (gitignored)
- Supabase CLI 2.105.0 needs `SUPABASE_GO_BINARY`; the Go binary was installed
  to `~/.local/share/supabase` this session
- Type generation: `supabase gen types typescript --project-id qsllyeztdwjgirsysgai
  --schema api,app,core,crm,dam,ingest,pim,plm`. Strip the CLI's update notice
  from the tail of the output or `tsc` fails on it.
- Worker/service-role secrets: `/home/ai/.crm-worker.env`, vault `vibe_coding`

## 9. Open questions and risks

- Phase 9 and the CI test gate are the only known-broken things left, and both
  are one permission away.
- Recharts 3's `accessibilityLayer` now defaults to true. Keyboard focus
  behaviour on the Overview charts has not been keyboard-tested; it is a new
  default, not a regression, and no console errors appear.
- The Overview page itself has never been screenshotted with real data by an AI
  session. The numbers are proven 49/49; the rendering is proven only for the
  chart primitives in isolation.
