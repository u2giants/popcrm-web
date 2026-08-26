---
issue: none
status: OPEN
owner: ccweb/claude — popcrm-web `claude/codebase-audit-68jwry` (2026-08-26 session)
---

# Codebase audit: five bugs fixed, seven reported — see [`fix_bugs.md`](../fix_bugs.md)

**The full audit report is [`fix_bugs.md`](../fix_bugs.md) at the repo root.**
This handoff is the session record; that file is the findings document. Read it
first — everything below assumes it.

## 0. ⚠️ READ THIS FIRST — THE CODE FIXES ARE NOT ON `main`

**Where things are, as of 2026-08-26:**

| What | Where it lives | Deployed? |
| --- | --- | --- |
| These two documents (`fix_bugs.md` + this file) | `main` | n/a — docs only |
| The five code fixes described in `fix_bugs.md` Part 1 | branch `claude/codebase-audit-68jwry`, commit `4bb7bcb` | **NO** |

So: if you are reading this on `main`, you are reading a report about fixes
that are **written, tested and pushed, but not live**. Do not re-fix them.
Get them by:

```
git fetch origin claude/codebase-audit-68jwry
git log --oneline origin/claude/codebase-audit-68jwry   # 4bb7bcb = the fixes
```

The branch is one commit on top of `e5fb235`, no conflicts. Albert chose to
publish the documents to `main` on their own and to leave the code fixes on
the branch for a later session to land deliberately — that split is
intentional, not an accident or an interrupted merge.

**Note on repo convention:** `CLAUDE.md` says this repo is single-branch
(commit straight to `main`, no feature branches). The branch exists only
because the session that produced it was assigned one. Landing the fixes means
getting commit `4bb7bcb` onto `main`; after that the branch can be deleted.
The normal GitHub Actions → GHCR → Coolify path deploys whatever `main` holds.

### One open decision for the owner

**Was fuzzy PO-number matching ever intended in the router?**
(`fix_bugs.md` Part 2 §G.) `matchOpportunity` calls
`fuzzyScore(searchText, r.production_po_number)` with the arguments inverted,
so that half of the `Math.max` scores ~0 and has never contributed. Exact PO
matching already runs earlier in the same function. Recommendation: leave the
behavior alone and delete the dead half; flipping the arguments would change
live email routing on a 0.72 confidence threshold, which is a business call.
Deliberately NOT changed this session.

The other Part 2 items need no decision — they need shared-db work or plain
worker changes. See §6.

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM frontend — a React 19 + Vite SPA
over the shared Supabase project `qsllyeztdwjgirsysgai`, plus the `workers/`
host jobs (Outlook ingest, reroute, contact-sync, summarize, ignore rules) and
the Fireflies webhook/chat server. Reads go through browser-safe `api.crm_*`
views; writes go to `crm.*` tables or guarded `api.*` RPCs. Deploys on push to
`main` via GitHub Actions → GHCR → Coolify, live at `https://crm.designflow.app`.

## 2. What we set out to do this session, and why

One instruction: *"Audit the codebase for inefficient code and bugs."* No prior
context, no specific symptom. Treated as a follow-on to
`plan_codebase_audit_remediation.md` (2026-07-26) — its fourteen findings were
read first and deliberately excluded, so everything reported is new.

## 3. Current state — what is true right now

The five code fixes are commit `4bb7bcb` on branch
`claude/codebase-audit-68jwry`, one commit on top of `e5fb235`, pushed but
**not on `main` and not deployed** (see §0). The two documents are on `main`.

Fixed and verified (detail in `fix_bugs.md` Part 1):

1. `DataTable` header quick-search matched only raw values, never the
   `filterLabel` display text the autocomplete itself suggests — Email
   Routing's Method and Status columns returned zero rows for any label search.
   `src/components/app/DataTable.tsx:194`.
2. `fetchCustomerPickerList(-1)` and `fetchCustomerBrands()` read unbounded with
   no `.range()`, which PostgREST silently truncates at `db-max-rows`. Both now
   page. `src/features/crm/api.ts:112,457,1226`.
3. `TriagePage` sorted on `contact.name`, which the view can return null despite
   the type — one nameless contact crashed the page.
   `src/features/crm/pages/TriagePage.tsx:70`.
4. `DataTable` rendered strictly by its once-seeded `colOrder`, silently
   dropping any column a caller added later. Now reconciled at render.
   `src/components/app/DataTable.tsx:153`.
5. Worker re-queried `core.customer` per message (12k+ round trips per
   `reroute`) for a few dozen distinct domains; now uses the file's own
   `cachedReference`, with expired-entry pruning so the map stays bounded in
   the long-running `fireflies-server`.
   `workers/crm-worker-supabase.mjs:138,302`.

Verification: `npm run lint` clean, `npx tsc -b` clean, `npm run build` clean,
`npm test` **178 passing** (172 pre-existing + 6 new). Baseline before the
changes was also fully clean, so nothing here is masking a pre-existing failure.

## 4. Everything we tried that did NOT work

- **`npm run lint` / `npx tsc -b` fail on a fresh clone** until `npm ci` runs
  (`Cannot find package '@eslint/js'`, `Cannot find type definition file for
  'vite/client'`). Not a repo bug — just install first. Worth a SessionStart
  hook if web sessions keep tripping on it.
- **First attempt at finding 4 used a `useEffect` + `setState`** to resync
  column order. It works, but trips `react-hooks/set-state-in-effect` — the same
  warning class `plan_codebase_audit_remediation.md` finding 12 had to clean up.
  Replaced with a render-time `useMemo`; no extra state, no warning.
- **First `git push` was rejected** with `GH007: Your push would publish a
  private email address`. Re-authored the commit as
  `Albert Hazan <u2giants@users.noreply.github.com>`, matching the identity
  already used throughout this repo's history.
- **Two regression-test assertions had to be rewritten**, not the code:
  `getByText(/rows$/)` does not match the toolbar's
  `"3 rows · 1 filter active"`, and `getByText('Rule match')` matches both the
  table cell and the open autocomplete suggestion. Both were bad test probes.

## 5. Root causes and key findings

- **Two of the five are the same root cause: a display/storage split that only
  one of two code paths respects.** Finding 1 (label vs raw value in search)
  and finding 3 (a type that claims `string` over a nullable column) both come
  from a mapping layer that is correct in one direction and unchecked in the
  other. `toBuyer`'s `(r.name ?? null) as unknown as string` is the specific
  mechanism that hid finding 3 from the compiler — that double-cast pattern
  appears throughout `api.ts` adapters and is worth a wider look.
- **Finding 2's blast radius comes from how widely those two feeds are shared.**
  `useCustomerPickerQuery` backs the customer combobox on eight pages plus
  global search; `useCustomerBrandMap` resolves logo, domain *and* the display
  name that Customer columns sort and filter by. A silent truncation there is
  app-wide and produces no error anywhere.
- **The worker already knew about both of its own problems.** The
  `db-max-rows` hazard behind finding 2 and the repeat-reference-read cost
  behind finding 5 are each documented in prose in
  `crm-worker-supabase.mjs` — the fix simply had not been applied to every
  call site. Reading a file's own comments was the highest-yield part of this
  audit.
- **The July remediation held.** Overview, the sidebar aggregates, the auth
  refresh gate, worker paging and the delta cursor all read as carefully done,
  and none of the fourteen prior findings recurred.

## 6. Exact next steps

1. **Land the five fixes**: get commit `4bb7bcb` from
   `claude/codebase-audit-68jwry` onto `main` (fast-forward or cherry-pick —
   it is one clean commit on top of `e5fb235`), then confirm the deploy at
   `https://crm.designflow.app`. Re-run `npm ci && npm run lint && npx tsc -b
   && npm test && npm run build` first; all were clean when the commit was
   made (178 tests).
2. **Spot-check finding 1 live** on Email Routing: type `Rule match` into the
   Method header search and confirm rows come back; repeat for
   `Company + dept` on Status.
3. **`fix_bugs.md` Part 2 §A** — write the `crm_customer_relation_counts`
   contract in `u2giants/shared-db` (branch + PR + timestamped migration,
   preview first), then change `CustomersPage.tsx:67-68` to consume it.
4. **`fix_bugs.md` Part 2 §D and §E** — pure worker changes, no contract
   needed, can be done any time.
5. **Answer the open decision in §0**, then either delete the dead half of the
   `Math.max` in `matchOpportunity` or flip the arguments deliberately.

## 7. Constraints and gotchas in force

- **Shared DB Gatekeeper.** All schema work goes to `u2giants/shared-db` first
  — no app-side DDL, no dashboard SQL, no local `supabase/migrations/`. Nothing
  in Part 1 touches the database; several Part 2 items do.
- **Single-branch model** per `CLAUDE.md` — which this session's designated
  branch conflicts with. See §0.
- **PostgREST silently truncates unbounded reads** at `db-max-rows`. Any new
  full-table read must page explicitly (`fetchAllRows` / `fetchAllColumns` in
  `api.ts`, `fetchAllRows` in the worker). This bit twice already.
- **`api.ts` adapters use `as unknown as string` on nullable columns.** The
  types are not load-bearing there; validate at the use site.
- **The worker's `referenceCache` is module-global with a 60s TTL.** Cache keys
  must be a pure function of the data they key, and per-item keys need the
  pruning that is now in `cachedReference`.

## 8. Access and environment

- Claude Code on the web, ephemeral container, repo cloned fresh; GitHub via the
  MCP server (no `gh` CLI). Node with `npm ci`; `npm test` is vitest.
- Supabase MCP was connected but **deliberately not used** — this was a static
  audit and there was no reason to touch the live project.
- No `.env` present and none needed; nothing was run against a real backend.
- Commit authored as `Albert Hazan <u2giants@users.noreply.github.com>`; the
  public-email push protection rejects `u2giants@gmail.com`.

## 9. Open questions and risks

- **Finding 2 is a fix for something that has not happened yet.** The customer
  count is currently under the ceiling ("hundreds of rows" per the code
  comment). Nobody has confirmed the actual `db-max-rows` value for this
  project, so the exact threshold is unknown — the paging is correct
  regardless, but the urgency is unquantified.
- **Finding 5 is unit-test-free.** `matchingRetailersByDomain` is not exported,
  and the change is internal and behavior-preserving, so the existing worker
  suite covers it only indirectly. The reasoning that the cache key is a pure
  function of `domain` is written up in `fix_bugs.md` Part 1 §5 — verify that
  claim before extending the cache to anything else.
- **This audit read `src/**` and `workers/**` only.** `Dockerfile`,
  `nginx.conf`, `systemd/`, `scripts/` and the GitHub Actions workflows were
  not reviewed. A security review was not run either.
- **Part 2 §F (`emails_skipped` lost updates) is left live.** The counter is
  advisory, but if anyone starts making decisions from it, fix it first.
