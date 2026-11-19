---
issue: 32            # completion = live proof ticked on all eight: #32–#37, #44, #63 (this file's §6)
status: OPEN
owner: zcode/ses_3445c287 (main)
---

# Handoff — live proof for the eight high-severity audit issues (#32–#37, #44, #63)

## 0. Business decisions only the owner can make

**None — nothing in this workstream needs Albert.** All fixes are landed and
deployed; the only remaining work (live verification in a browser / on preview)
is fully AI-executable with credentials already in 1Password (see §8).

Already settled — do NOT re-ask (2026-11-18):
- Issue #35 shipped the issue's own sanctioned client-side count alternative
  (six exact server-side head-count queries) instead of a new shared-db RPC.
- Issue #63 shipped the issue's own sanctioned fallback: quarantine records in a
  local JSON state file (`OUTLOOK_QUARANTINE_FILE`), not a DB table.

## 1. What this application is

POP CRM (`popcrm-web`) — internal operations console for POP Creations staff:
customers, contacts, licensing pipeline, Outlook email routing, meeting notes,
tasks. Vite/React/TypeScript SPA on nginx, one Coolify container; all data via
the shared Supabase project. Production `https://crm.designflow.app`, preview
`https://crm-dev.designflow.app`. Repo: https://github.com/u2giants/popcrm-web
(single-branch `main`; every push builds, publishes GHCR, and auto-deploys
production). Background jobs live in `workers/` and run on the host.

## 2. What we set out to do this session, and why

Albert asked (2026-11-18): pull latest, clear the 8 open **severity: high**
GitHub issues in parallel. These came from the 2026-11-18 full codebase audit
(handoff: https://github.com/u2giants/popcrm-web/blob/main/HANDOFF.d/2026-11-19T0331Z-hetz-claude-codebase-audit-44-issues.md).
Each issue body is a complete implementation plan with a STATUS table; each fix
was built by its own sub-agent in its own git worktree, then landed on `main`.

## 3. Current state — what is true right now (checked 2026-11-19T04:05Z / 2026-11-18 11:05 PM EST)

All 8 fixes **landed on `main`, pushed, CI green, deployed to production**;
every non-live-proof STATUS row on each issue is ticked with evidence and a
signed comment. Working tree clean; all 8 worktrees and `fix-issue-*` branches
removed. Lint 0 warnings; full suite 252/252 passing; `npm run build` green.

| Issue | Fix (one line) | Landed commit |
|---|---|---|
| [#32](https://github.com/u2giants/popcrm-web/issues/32) | Bulk domain routing: per-customer write queue, target validated first, success only on real writes | [3049c212](https://github.com/u2giants/popcrm-web/commit/3049c212) |
| [#33](https://github.com/u2giants/popcrm-web/issues/33) | Merge-contacts dialog keyed per kept contact; always opens clean | [d9e851a3](https://github.com/u2giants/popcrm-web/commit/d9e851a3) |
| [#34](https://github.com/u2giants/popcrm-web/issues/34) | Admin bulk assign disabled with no salesperson chosen; explicit confirmed "Clear assignments"; hidden-row selections pruned on filter change | [0f37c3c4](https://github.com/u2giants/popcrm-web/commit/0f37c3c4) |
| [#35](https://github.com/u2giants/popcrm-web/issues/35) | Department delete: exact server-side reference counts, refuse + toast counts, two-click confirm | [63c6c21a](https://github.com/u2giants/popcrm-web/commit/63c6c21a) |
| [#36](https://github.com/u2giants/popcrm-web/issues/36) | Reroute job never overwrites manual customer assignment; compare-and-set writes | [18f22953](https://github.com/u2giants/popcrm-web/commit/18f22953) + docs [5b5c02bc](https://github.com/u2giants/popcrm-web/commit/5b5c02bc) |
| [#37](https://github.com/u2giants/popcrm-web/issues/37) | Logos tab reads real domains/logos from brands feed; feeds refetched after every save | [d0f1b1f6](https://github.com/u2giants/popcrm-web/commit/d0f1b1f6) |
| [#44](https://github.com/u2giants/popcrm-web/issues/44) | Error boundary per screen + root; app stays usable when a screen throws or storage is unavailable | [c8415d6c](https://github.com/u2giants/popcrm-web/commit/c8415d6c) |
| [#63](https://github.com/u2giants/popcrm-web/issues/63) | Outlook ingest: per-page checkpoints (survives kill mid-backlog), message quarantined after 3 failures | [40629cc0](https://github.com/u2giants/popcrm-web/commit/40629cc0) |

Merge-fix on top: [10a6cf65](https://github.com/u2giants/popcrm-web/commit/10a6cf65) (`main` tip at write time).

- Deploy: Actions run https://github.com/u2giants/popcrm-web/actions/runs/44454114534 concluded success 2026-11-18 ~10:55 PM EST; `https://crm.designflow.app` returned HTTP 200.
- Docs touched by fixes: [docs/quirks.md](https://github.com/u2giants/popcrm-web/blob/main/docs/quirks.md), [docs/configuration.md](https://github.com/u2giants/popcrm-web/blob/main/docs/configuration.md), [workers/README.md](https://github.com/u2giants/popcrm-web/blob/main/workers/README.md), AGENTS.md pending-work row.
- **Not done:** the live-proof STATUS row on each of the 8 issues is still ⬜ open. Issues stay OPEN until then (owner rule: live proof before closing; never a second ticket).

## 4. Everything we tried that did NOT work

- **Parallel landing broke #35's tests at the seam.** After cherry-picking all 8
  branches, 4 tests in `DataAdminDepartments.test.tsx` failed: #37's new
  `useCustomerBrandsQuery` was included in the page error flag, and #35's
  fixture didn't mock it, so the real hook errored against the stubbed supabase
  client and the page rendered its error state ("Unable to find an element with
  the text: Buying"). Fix: mock `useCustomerBrandsQuery` in that fixture
  ([10a6cf65](https://github.com/u2giants/popcrm-web/commit/10a6cf65)). Lesson:
  two agents editing different regions of the same page file still share the
  test fixture seam — re-run the FULL suite after landing parallel branches, not
  per-branch suites only.
- **First push to `main` rejected (non-fast-forward).** Remote had moved during
  the agent run (another session landed the audit handoff doc + a shared-db
  sync). `git pull --rebase origin main`, re-ran lint+test (green), pushed fine.
- **`ai-gh-signature` printed the wrong engine** ("Claude chat") for this ZCode
  session; the signature lines on the 8 issue comments were written manually as
  `Posted by ZCode chat (ses_3445c287) on hetz`.
- **#35's planned shared-db RPC does not exist and wasn't needed.** Searched
  `src/lib/database.types.ts` and all shared-db migrations: no existing
  department reference-count RPC. Rather than a schema change (shared-db repo,
  claim-first, preview promotion), used the issue's sanctioned client-side
  alternative. Do not re-plan the RPC unless counts prove too slow at scale.
- **#63 quarantine table would have needed shared-db too** — used the issue's
  local JSON file fallback instead. Same reasoning.

## 5. Root causes and key findings

- #32 root cause: concurrent unawaited writes to the same customer's
  `routing_aliases` string; also `CREATE_NEW` allowed in bulk mode and holder
  resolution limited to the visible segment. Fixed in
  [DomainRoutingPanel.tsx](https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/components/DomainRoutingPanel.tsx).
- #33 root cause: dialog state (picked duplicate) outliving the contact via a
  non-keyed component. Keyed per kept contact in
  [ContactDrawer.tsx](https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/components/ContactDrawer.tsx).
- #34 root cause: Apply sent empty salesperson list as a bulk write; selection
  kept ids hidden by filters. Fixed in
  [AssignmentsPanel.tsx](https://github.com/u2giants/popcrm-web/blob/main/src/features/admin/AssignmentsPanel.tsx).
- #35 root cause: delete cascaded `department_id` to null on emails/meetings/
  notes/tasks. Guard in [api.ts `deleteDepartment`](https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/api.ts) + confirm dialog in
  [DataAdminPage.tsx](https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/pages/DataAdminPage.tsx).
- #36 root cause: reroute sweep compared "improves" without respecting
  `routing_method = MANUAL` and wrote without compare-and-set. `mayReroute` in
  [workers/lib/worker-foundation.mjs](https://github.com/u2giants/popcrm-web/blob/main/workers/lib/worker-foundation.mjs);
  CAS write in [crm-worker-supabase.mjs](https://github.com/u2giants/popcrm-web/blob/main/workers/crm-worker-supabase.mjs).
- #37 root cause: Logos tab read the picker feed (no domain/logo fields) and
  never invalidated feeds after saves.
- #44 root cause: no React error boundary; unguarded `localStorage`. New
  [ErrorBoundary.tsx](https://github.com/u2giants/popcrm-web/blob/main/src/components/app/ErrorBoundary.tsx).
- #63 root cause: cursor only saved at end of full walk; any message failure
  aborted the mailbox forever. Per-page checkpoints + 3-strike quarantine in
  [crm-worker-supabase.mjs](https://github.com/u2giants/popcrm-web/blob/main/workers/crm-worker-supabase.mjs); replay procedure documented in
  [workers/README.md](https://github.com/u2giants/popcrm-web/blob/main/workers/README.md).
- Pattern that worked: one worktree + one branch per issue, agents never push,
  lead cherry-picks sequentially and runs the full gates once. Only seam
  failure was the shared test fixture above.

## 6. Exact next steps (in order)

1. Confirm the deployed build is current: the app header shows the commit hash
   (from `COMMIT_HASH`); expect `10a6cf65` on https://crm.designflow.app. If
   preview is used instead, confirm which commit https://crm-dev.designflow.app
   serves (per [docs/deployment.md](https://github.com/u2giants/popcrm-web/blob/main/docs/deployment.md)) before proofing.
2. Get a CRM login from 1Password vault `vibe_coding` (how:
   [docs/1password.md](https://github.com/u2giants/popcrm-web/blob/main/docs/1password.md));
   browser automation via the browser-use skill.
3. For each UI-verifiable issue (#32, #33, #34, #35, #37, #44): run the exact
   reproduction written in that issue's body (each has one), confirm the fixed
   behavior. You'll know each worked when the issue's stated expected outcome
   holds live (e.g. #32: all 6 test domains end on the target customer with a
   single success message; #44: a forced screen error shows the fallback with
   menu still working).
4. #36 live proof (its step 3): on PREVIEW data only — manually set an email's
   customer, run the reroute worker per the issue's exact command, confirm the
   manual assignment survives and the log reports the skip. Never point the
   worker at the production mailbox.
5. #63 live proof (its step 4): on a PREVIEW mailbox configuration, inject a
   failing message id, confirm two failed runs abort-and-resume at the
   checkpoint and the third quarantines it (see `OUTLOOK_QUARANTINE_FILE` in
   [docs/configuration.md](https://github.com/u2giants/popcrm-web/blob/main/docs/configuration.md)).
6. After each verification: tick that issue's live-proof STATUS row, comment
   the evidence signed `Posted by ZCode chat …`, close the issue only when the
   outcome is verified live.
7. When all 8 are closed: update the AGENTS.md pending-work row ("Live proof
   for high-severity audit issues…") and DELETE this handoff file in that same
   commit (successor rule: commits verified on `main`, obligations carried
   forward, no unique decisions left here).

## 7. Constraints and gotchas in force

- Single-branch: push to `main` deploys **production** immediately; never push
  a `main` that fails `npm run lint` (zero warnings) or `npm test`.
- `src/components/ui/*` are hand-maintained primitives — don't regenerate.
- All schema/DB changes go through `popcre/shared-db` claim-first; none were
  needed here — keep it that way unless step counts prove too slow.
- Fixes for #35 and #37 both live in `DataAdminPage.tsx`; future edits there
  must re-run BOTH test files.
- Sign every GitHub post with this session's actual engine (`ZCode`), not what
  `ai-gh-signature` emits if it mislabels the engine.

## 8. Access and environment

- `gh` authenticated as `u2giants`; commits signed as
  `Albert Hazan <u2giants@users.noreply.github.com>`.
- Secrets: 1Password vault `vibe_coding` only (no values in this file or chat).
- Environments: prod https://crm.designflow.app (has the fixes, deploy run
  44454114534), preview https://crm-dev.designflow.app, worker host = same
  hetz box (Coolify + systemd; see
  [docs/deployment.md](https://github.com/u2giants/popcrm-web/blob/main/docs/deployment.md)).
- Local checkouts: canonical `/worksp/popcrm-web` (clean, on `main`);
  `/worksp/shared-db` is the shared-db canonical (untouched, read-only for us).

## 9. Open questions and risks

- Live proof outstanding — the whole reason this file exists (see §6).
- Preview environment currency unverified: issues say "prove on preview" but
  production demonstrably has the fixes; decide per environment at step 1.
- CI log warns GitHub actions still target Node 20 (deprecation ~2026-06-16) —
  already a known open row in AGENTS.md pending work; not this workstream.
- Outside this workstream, observed at closeout (do not act without its owner):
  one `promotion-parked` PR currently open in `popcre/shared-db`; one parked
  promotion list query returned length 1 at 2026-11-19T04:00Z.

## (b) Sub-agent blocks — one per dispatched agent

All eight ran 2026-11-18 in isolated worktrees (`/worksp/wt/issue-NN`, branches
`fix-issue-NN`, since removed after their commits landed on `main`). None
pushed, opened PRs, or edited GitHub; each verified lint 0 + tests green in its
worktree before reporting.

### Agent: issue-32 (bulk domain routing)
- **Asked to do:** implement issue #32's 4 STATUS steps in `DomainRoutingPanel.tsx` + tests.
- **Actually did:** per-customer promise queues, pre-validation with rollback of committed removals, `CREATE_NEW` throws in bulk mode, holder resolution from segment `all`. Commit `9d022351` → landed as [3049c212](https://github.com/u2giants/popcrm-web/commit/3049c212).
- **Found:** deadlock-risk note in the issue — writes must queue in customer-id order; honoured.
- **PR / branch:** none (local branch, cherry-picked by lead).
- **Worktree:** finished (removed).
- **Deliberately did NOT do:** the issue's section-8 RPC option (shared-db out of scope); live proof.

### Agent: issue-33 (merge contacts)
- **Asked to do:** issue #33 steps. **Actually did:** keyed dialog + internal close() clearing query/dropId; 2 new tests incl. the drawer-level repro. Commit `3ef1d292` → [d9e851a3](https://github.com/u2giants/popcrm-web/commit/d9e851a3).
- **Found:** `MergeCustomersDialog` in `CustomersPage.tsx` already used the same keying pattern — copied it.
- **Worktree:** finished (removed). **Deliberately did NOT do:** live proof.

### Agent: issue-34 (admin apply wipe)
- **Asked to do:** issue #34 steps. **Actually did:** Apply disabled without `bulkMain`; confirmed "Clear assignments" via existing `ConfirmDeleteDialog`; selection pruned to visible rows on filter changes; 2 tests. Commit `f9d15c22` → [0f37c3c4](https://github.com/u2giants/popcrm-web/commit/0f37c3c4).
- **Found:** a `useEffect`-based prune trips the `react-hooks/set-state-in-effect` lint rule — restructured into the filter-change handlers to keep the zero-warning baseline.
- **Worktree:** finished (removed). **Deliberately did NOT do:** live proof.

### Agent: issue-35 (department delete)
- **Asked to do:** issue #35 steps incl. optional shared-db RPC. **Actually did:** six exact head-count queries (fail-closed), `DepartmentInUseError` with counts, `departmentUseSummary`, two-click confirm; 5 tests. Commit `47f2f4bd` → [63c6c21a](https://github.com/u2giants/popcrm-web/commit/63c6c21a).
- **Found:** no existing reference-count RPC anywhere — used the issue's sanctioned client-side alternative (§0).
- **Worktree:** finished (removed). **Deliberately did NOT do:** shared-db PR, live proof.

### Agent: issue-36 (reroute overwrite)
- **Asked to do:** issue #36 steps. **Actually did:** `mayReroute` beside `routingImproves`; CAS write (`.eq routing_status`, `.eq/.is company_id`, `.select id`); exported `runReroute` seam; 6 tests; quirks.md section + workers/README paragraph + AGENTS.md pending row. Commits `a1f19414`,`f14b6945` → [18f22953](https://github.com/u2giants/popcrm-web/commit/18f22953), [5b5c02bc](https://github.com/u2giants/popcrm-web/commit/5b5c02bc).
- **Found:** `vitest.config.ts` already includes worker tests — no config change needed.
- **Worktree:** finished (removed). **Deliberately did NOT do:** running the worker anywhere; live proof.

### Agent: issue-37 (logos tab)
- **Asked to do:** issue #37 steps, Logos-tab area only. **Actually did:** `logoCustomers` merged from brands feed, brands in page loading/error/refresh, `invalidateLogoFeeds()` after all three saves; 2 tests. Commit `1926200a` → [d0f1b1f6](https://github.com/u2giants/popcrm-web/commit/d0f1b1f6).
- **Found:** brands feed also needed in `refresh()` or the error-state retry can't recover a brands failure.
- **Worktree:** finished (removed). **Deliberately did NOT do:** any departments-area edit; live proof.

### Agent: issue-44 (error boundary)
- **Asked to do:** issue #44 steps. **Actually did:** `ErrorBoundary.tsx` (page-level keyed by pathname + root), localStorage try/catch guards, `ErrorState` action prop, 9 tests. Commit `cd609db8` → [c8415d6c](https://github.com/u2giants/popcrm-web/commit/c8415d6c).
- **Found:** `EmptyState` already had the `action`-prop pattern — mirrored it in `states.tsx` (one file beyond the issue's named set, minimal).
- **Worktree:** finished (removed). **Deliberately did NOT do:** live proof.

### Agent: issue-63 (email ingest)
- **Asked to do:** issue #63 steps 1–3. **Actually did:** per-page `nextLink` checkpoints through `saveCursor` CAS (killed run resumes mid-walk), 3-strike quarantine via `createOutlookFailureStore` JSON file, loud logs + counts, README replay procedure, configuration.md env doc, 10 new tests. Commit `05176257` → [40629cc0](https://github.com/u2giants/popcrm-web/commit/40629cc0).
- **Found:** no store passed = old abort contract preserved (back-compat for callers).
- **Worktree:** finished (removed). **Deliberately did NOT do:** DB-table quarantine (local file fallback, §0); live proof.

---

### Self-audit gate (handoff-writer, recorded 2026-11-19T04:10Z)

1. Street-newcomer continuity: **Yes** — §1 app context, §3 exact state with
   commit URLs, §6 ordered steps with gates, §8 access.
2. Continue as effectively as me: **Yes** — §4 dead ends (fixture seam, push
   rejection, signature tool), §5 root causes, §7 traps carry session-only
   knowledge.
3. All relevant detail present: **Yes** — background §1–2, state §3, failures
   §4, findings §5, steps §6, constraints §7, access §8, risks §9, per-agent
   §(b).
4. §0 completeness: swept §1–9 and (b) line by line; the only owner-facing
   items found (the two issue-plan alternative choices) are already-settled
   rulings listed in §0 as "do NOT re-ask"; everything else is AI-executable.
   **Yes.**
