# Fresh-session handoff: Phases 7A, 7B, 8 done; Phase 9 blocked on one permission

Status: OPEN — Phase 9 cannot be finished by an AI session under current tool permissions
Created: 2026-08-13 04:10 UTC
Machine: hetz
Agent: Claude (Opus 5)

## 0. DECISIONS ONLY THE OWNER CAN MAKE

1. **Allow an AI session to edit `.github/workflows/*.yml` in this repo.** Two
   changes are written, verified and waiting on this: removing the malformed
   shell tail (Phase 9's entire scope) and adding `npm test` to the CI `verify`
   job. Both are blocked by the Claude Code permission classifier, not by any
   technical problem. Recommendation: allow it — the repo's whole deploy
   contract lives in that one file and no phase past 9 can be verified without
   touching it.
2. **Allow browser localStorage injection for visual verification**, or accept
   that AI sessions cannot screenshot logged-in pages. The documented method
   (mint a Supabase session, inject it, drive Playwright) is blocked by the same
   classifier. A credential-free workaround exists for charts only
   (`/__charts`, see §3), but nothing can screenshot the real Overview with real
   data.

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

### Phase 9 — malformed deploy shell. BLOCKED, diagnosis complete.

`.github/workflows/deploy.yml` lines 143-149 are orphaned remnants of a deleted
loop: an `exit 0`, an unmatched `fi`, an unmatched `done`. `bash -n` on the
extracted block fails with "syntax error near unexpected token `fi`". The fix is
to delete exactly those seven lines and nothing else. I could not apply it: the
permission classifier blocks AI edits to `.github/workflows/`.

Why it has never been noticed: bash parses lazily, and the step's success path
`exit 0`s at line 126 long before it reaches the junk. The junk only parses if
the deploy wait loop runs its full 7.5 minutes, which already ends in `exit 1`.
So it is latent, not currently breaking anything.

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

1. Get decision 0.1. Then delete `.github/workflows/deploy.yml` lines 143-149,
   add `npm test` to the `verify` job, and validate with `bash -n` on every
   extracted `run:` block. **You'll know it worked when:** `bash -n` is clean and
   the next Build and Deploy run passes verify, image, deploy and exact-SHA check.
2. Phase 10 (stale auth refresh after logout) through Phase 14 are unchanged and
   still valid. Read the plan; do not re-derive.
3. The `src/App.tsx:48` lint warning belongs to Phase 12. Leave it.
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
