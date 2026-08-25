---
issue: 4
status: OPEN
owner: hetz/claude — popcrm-web main (2026-08-25 session)
---

# Customer classification: 694 unclassified companies, and the surfaces that read `customer_status` alone

## 0. ⚠️ DECISIONS ONLY THE OWNER CAN MAKE

Put this whole list to Albert in ONE message before starting work. Do not trip
over them one at a time.

**Blocking — work cannot proceed correctly without an answer**

1. **Who classifies the 694 unclassified companies?** Only a person can decide
   which are real CRM customers; no system field answers it (§5). Recommendation:
   Albert does one sitting with the bulk status editor on the Unclassified tab,
   optionally against a signal-ranked list this repo can generate (§6 step 1).
   Blocks everything else in this file.
2. **Should we load ColdLion order history to help?** `coldlion.order_history_line`
   exists in the shared database, keyed by customer code, and is **empty** —
   nothing has ever loaded it. With it, "has ordered in the last 24 months" would
   rank the 694 by real trading activity. Recommendation: first make a read-only
   call to the ColdLion `/orders` endpoint and report what it returns (volume,
   date range, whether it is customer-level) before committing to the load; the
   load itself is shared-db governed work, not app work. Albert has NOT authorized
   the read-only call yet — it was offered and the conversation moved on.

**A wrong guess is recoverable, but rework is wasteful**

3. **Should the hub prospect fallback stay?** `effectiveCustomerStatus`
   (`src/features/crm/pages/_shared.ts`) still reads an explicit hub prospect flag
   (`is_potential = true` / `status = 'potential'`, 10 companies) as Potential
   Customer when the CRM status is empty. It survived the 2026-08-25 revert because
   that flag is a deliberate mark, not an import default. Recommendation: keep it.
   If Albert wants CRM status to be the *only* source, delete those three lines and
   the matching test in `_shared.test.ts`.
4. **Do the "too small to matter" customers get classified at all?** Business rule
   says ColdLion contains active-but-too-small accounts that do not warrant CRM
   attention. Recommendation: mark them `OTHER` ("Not a customer") so they leave
   the Unclassified pile permanently, rather than leaving them untriaged forever.
   Albert has not ruled on this.

**Not part of this work, and nobody is on it**

5. **The Overview KPI RPC and the Contacts segment views are shared-database
   objects** (`api.crm_overview_counts`, `api.crm_contact_segment_list`,
   `api.crm_contact_segment_counts`). They count by `customer_status` only. If
   classification (item 1) happens, they self-correct and need no change.
   Recommendation: do nothing until after classification; revisit only if Albert
   decides unclassified-but-real customers must still count. Any change routes
   through a `u2giants/shared-db` pull request, not this repo.
6. **The email-routing worker matches customers by `customer_status` only**
   (`workers/crm-worker-supabase.mjs:149`). After classification it will start
   matching mail for newly-classified customers — a real behaviour change to mail
   routing, not just a display change. Recommendation: Albert should expect it and
   say if he wants it staged rather than immediate.

**Already settled — do NOT re-ask**

- ColdLion presence/absence never sets CRM classification; the link runs CRM →
  ColdLion only (Albert, 2026-08-25, shared-db PR #1543, merged).
- An active ERP record is not evidence of being a customer (Albert, 2026-08-25;
  the opposite was shipped and reverted the same day — see §4).
- Ingested email domains never promote into customer records (pre-existing Settled
  rule).

## 1. What this application is

POP CRM (`popcrm-web`) is the customer-relationship app for POP Creations, a
licensed-merchandise company owned by Albert Hazan. Sales staff use it to track
customer companies, their contacts, programs (opportunities), meetings, tasks,
and inbound email routing.

- Repo: `u2giants/popcrm-web`, single-branch — commit straight to `main`, no
  feature branches.
- Stack: React + TypeScript + Vite, Tailwind, TanStack Query, Supabase client.
- Runs at <https://crm.designflow.app> (Coolify on the `hetz` host). Deploy path:
  push `main` → GitHub Actions → GHCR image → Coolify. Never SSH-deploy.
- Database: shared Supabase project `qsllyeztdwjgirsysgai`, used by CRM, PIM, DAM
  and DesignFlow PLM. All schema changes are authored in `u2giants/shared-db`
  first; this repo carries a read-only `shared-db/` mirror.
- Business rules live in `shared-db/docs/business-rules/`. The relevant topic here
  is `customers-contacts-and-organizations.md`.

## 2. What we set out to do this session, and why

Albert asked for bulk status editing: select several rows in a table and set the
status on all of them at once (delivered — see §3). While verifying it he noticed
Burlington, a real customer, displaying as "New Company", which opened the second
and larger thread: **how the CRM decides whether a company is a customer at all.**
That thread produced a wrong fix, a revert, a business ruling, and this file.

## 3. Current state — what is true right now

**Done, shipped, verified — needs nothing further**

- **Bulk status editing.** Selection now lives inside the shared table component
  (`src/components/app/DataTable.tsx`): opt in with `selectable`, and the table
  renders a checkbox column (shift-click ranges, select-all header box) plus a
  bulk bar that applies one value of any editable column to every selected row via
  `onCellEdit`, skipping rows already on that value. `selectionActions` lets a page
  add its own buttons to that bar. Enabled on Customers, the email-domain triage
  tab, Contacts, Meetings, Departments and Email Routing. Commit `4e0effd`,
  deployed and confirmed in the live bundle.
- Albert then extended it himself in commit `456988e` ("Allow merging multiple
  customer records") so Merge accepts more than two rows. Tests pass with it.
- The old per-page selection bars and the `useRangeSelection` hook were deleted.
- Tests: `src/components/app/DataTable.selection.test.tsx` (bulk apply,
  shift-range, select-all/clear). Whole suite green — 17 files, 171 tests.

- **Status display rule.** `effectiveCustomerStatus` in
  `src/features/crm/pages/_shared.ts` is now the single place that turns a company
  row into a badge; the Customers table and `CustomerDrawer.tsx` both call it. It
  returns `customer_status` when set, Potential Customer for an explicit hub
  prospect flag, otherwise UNASSIGNED ("New Company"). Commits `aaa7755`
  (revert of the bad rule) and `b36f672` (label/doc correction). Deployed.
- The Customers "Source" column now reads **"In ERP"** where it used to read
  "ERP confirmed" (`CustomersPage.tsx:56`) — an ERP record proves nothing about
  customer status.

- **Business rule recorded.** shared-db PR **#1543**, merged 2026-08-25 18:42 UTC:
  what ColdLion's customer list is and is not, and the CRM → ColdLion link
  direction. It also corrected the previous claim that "ERP/PLM evidence is
  authoritative for whether a Customer is active", which is what caused §4.

**Open — the reason this file exists**

- **694 of 861 companies have no `customer_status`** and therefore read as
  "New Company". Real customers are mixed in with ERP vendors, licensors and
  freight carriers. Nobody has classified them. Distribution as of 2026-08-25:
  28 ACTIVE_CUSTOMER, 50 POTENTIAL_CUSTOMER, 89 OTHER, 694 empty.
- Three surfaces treat "no CRM status" as "not a customer", so unclassified real
  customers are invisible to them (measured, 2026-08-25):
  - Contacts page segments — 354 of 790 company-linked contacts sit in Triage.
  - Overview KPIs "Customers" and "Contacts" — undercount.
  - Email-routing worker — cannot match those companies' mail; 10 of the 457
    triage domains belong to companies that are really customers.
  None of these is a code defect on its own; they are correct given empty data.

**Working tree / branch state:** `main` is clean and pushed; the session worktree
`.claude/worktrees/bulk-status-update-tables-6a1b8c` is clean and its branch is
merged. Nothing is half-done in the repo.

## 4. Everything we tried that did NOT work

1. **Inferring Active Customer from the hub `status = 'active'` flag — shipped and
   reverted the same day.** After Burlington read "New Company", I extended the
   status fallback so a company with no CRM status but an active hub record read
   as Active Customer. It looked justified: `AGENTS.md` said `is_potential = false`
   means "PLM/ERP-confirmed active customer", and the business-rules library said
   ERP evidence is authoritative for whether a customer is active. It was wrong.
   The 2026-07-15 ColdLion import created 779 companies all stamped
   `company_type = customer`, `status = active`, so the rule promoted 101
   companies including COLD LION TECHNOLOGIES (an ERP vendor), Charles M Schulz
   Creative Associates (a licensor) and BRYDENS XPRESS (freight). Albert caught it.
   Reverted in `aaa7755`; the misleading sentences in `AGENTS.md` and the library
   were corrected so no future session repeats it. **Do not re-derive
   customer-ness from any hub or ERP flag.**
2. **Looking for a discriminating field inside ColdLion's customer record.**
   Tested salesperson code, commission percentage and factor code against the 89
   companies Albert had personally marked "Not a customer": 78 have a salesperson,
   77 have a commission, 78 have a factor — the same marks Burlington has.
   ColdLion's customer table is an accounting/shipping master; no field in it
   carries the judgement. Don't repeat this analysis.
3. **Looking for order history already in the shared database.**
   `coldlion.order_history_line` exists with a `customer_code` column but holds
   **0 rows**. `plm.production_order` has 3,212 rows but every `company_id` and
   `factory_id` is NULL, and `pim.customer_order` and
   `public.prod_order_headers_current` are empty. There is no usable sales history
   in the database today.
4. **Verifying the UI locally as a real user.** The magic-link session minted for
   browser testing (service-role `generate_link` + `verify`, then injecting
   `localStorage['sb-qsllyeztdwjgirsysgai-auth-token']`) authenticates fine but
   lacks CRM app access, so `app.has_app_access('crm')` is false and every
   customer list RPC returns zero rows. The email-domain triage tab DOES render
   (457 rows), which is how the bulk bar was verified visually. For anything
   customer-row-specific, verify by SQL against production instead, or ask Albert
   to look at the live site.

## 5. Root causes and key findings

- **Two status axes exist and only one carries judgement.** `customer_status`
  (CRM) is set by people and is the only field that says whether a company is a
  customer POP works. The hub axis (`status`, `is_potential` in `core.customer`)
  describes the ERP account record. See `AGENTS.md` → the customer row in the
  identifiers table, and shared-db `docs/business-rules/customers-contacts-and-organizations.md`.
- **Why ColdLion's list cannot be trusted as a customer list** (Albert, 2026-08-25):
  anything POP ships from its warehouse — a Licensor included — must exist in
  ColdLion as a customer to get a pick ticket; the list reaches back to the 2006
  founding and roughly 99% of those are defunct (out of business, or bought a
  discontinued line such as books); and some genuinely active accounts are too
  small to matter for CRM.
- **The link to ColdLion already exists.** 793 of 861 CRM companies carry their
  ColdLion `customerCode` in `core.company_source_ref` (`source_system = 'coldlion'`,
  `source_table = 'customers'`, 830 refs) with the full raw ERP record in `raw`.
  23 companies have more than one ColdLion code — Burlington has MOD010 and MOD011.
  Nothing needs building to "link" the systems; the question is only what the link
  means, and the rule now says it enriches and never classifies.
- **Legitimate disagreements between the systems** (Albert, 2026-08-25): an Active
  Customer may have no ColdLion record (order received, not yet invoiced); a
  Potential Customer may have one (past business, e.g. At Home). Neither is an
  error to repair.
- **Where the 694 came from:** 779 companies created 2026-07-15 by the ColdLion
  import (681 of them still unclassified), 67 on 2026-06-21 (all classified), 12
  on 2026-06-25, 3 on 2026-07-23.
- **DataTable selection design note:** the shift-click anchor is React state, not
  a ref, because `selectionActions` hands a `clearSelection` callback to the caller
  during render and ESLint's `react-hooks/refs` rule forbids reading a ref there
  (`src/components/app/DataTable.tsx`, `selectAnchor`).

## 6. Exact next steps

1. **Produce a signal-ranked list of the 694 unclassified companies.** Rank by
   real CRM signal — count of linked contacts, count of email messages, most
   recent email date — so genuine customers surface above freight carriers. Query
   `core.customer` left-joined to `core.contact_company` and `crm.email_message`,
   filtered to `customer_status is null`. *You'll know it worked when* the top of
   the list is recognisable retailers and the bottom is one-off shippers.
2. **Put §0 to Albert in one message and get the answers.** *You'll know it worked
   when* items 1–4 of §0 each have a one-word answer.
3. **Classify.** Albert works the Customers → Unclassified tab with the bulk
   editor: filter/sort, shift-click a run of rows, set Status, Apply. *You'll know
   it worked when* the Unclassified tab count falls and the Customers tab count
   rises by the same number.
4. **Re-measure the three affected surfaces.** Re-run the counts in §3 for the
   Contacts segments, the Overview KPIs and the triage-domain overlap. *You'll
   know it worked when* the Contacts Triage count drops by roughly the number of
   contacts at newly-classified companies, and the Overview "Customers" KPI equals
   the Customers tab count.
5. **Only if §0 item 2 is authorised:** make the read-only ColdLion `/orders` call
   and report volume, date range and whether it is customer-level. Base URL
   `http://x5.coldlion.com/EhpApi`; existing helpers and paging live in
   `shared-db/tools/coldlion-sync-common.mjs`. *You'll know it worked when* you can
   state how many distinct customer codes have ordered in the last 24 months.
6. **Only after step 4 shows a residual problem:** revisit §0 item 5 (the shared
   database counting objects), via a `u2giants/shared-db` pull request.
7. **Delete this file** when the 694 are classified and step 4 shows the surfaces
   agree, and close issue #4 in the same commit.

## 7. Constraints and gotchas in force

- **`popcrm-web` is single-branch.** Commit to `main`; no feature branches. Deploy
  is Actions → GHCR → Coolify on push. Never SSH to the host to deploy.
- **All schema/RPC/view changes go through `u2giants/shared-db`** — branch, pull
  request, timestamped migration, preview first. **The AI merges shared-db pull
  requests; do not ask Albert to merge them.** No app-side DDL, no dashboard SQL,
  no local `supabase/migrations/` edits here. `shared-db/` in this repo is an
  auto-synced read-only mirror.
- **Application row data belongs to the app session** — classifying customers is
  ordinary CRM data work and does not need the shared-db route. Structure does.
- **Never infer customer-ness from ERP/hub fields.** This is the exact trap of §4.
- **Concurrency:** other sessions and Albert himself commit to this repo. `git
  fetch` and rebase before pushing — this session hit a rejected push and a
  cancelled deploy run from a concurrent shared-db sync commit. Stage only your
  own files.
- **A cancelled "Build and Deploy" run is not necessarily a failure** — a later
  push in the same concurrency group cancels it, and if that later commit contains
  your change, it still ships. Verify by grepping the live bundle, not by trusting
  the run list.
- Do not edit or delete another session's `HANDOFF.d/` file.

## 8. Access and environment

- **Machine:** `hetz`. Repo at `/worksp/popcrm-web`; this session used the worktree
  `/worksp/popcrm-web/.claude/worktrees/bulk-status-update-tables-6a1b8c`.
- **GitHub:** `gh` CLI authenticated as `u2giants`. Commits must show
  `Albert Hazan <u2giants@users.noreply.github.com>`.
- **Supabase:** the `supabase` MCP is connected to production project
  `qsllyeztdwjgirsysgai` and can run read-only SQL. Treat it as read-only for
  anything structural.
- **Secrets — locations only, never values:** the CRM worker's Supabase
  service-role key is in the machine-local file `/home/ai/.crm-worker.env`; the
  ColdLion API key is 1Password `vibe_coding` → "Coldlion ERP API key
  x5.coldlion.com"; Supabase anon key/URL are in `.env.example` in this repo.
- **Browser verification recipe** (and its limit — see §4 item 4): mint a session
  with service-role `generate_link` + anon `verify`, write the JSON into
  `localStorage['sb-qsllyeztdwjgirsysgai-auth-token']`, reload. The helper script
  used this session is at
  `/tmp/claude-1000/-worksp-popcrm-web--claude-worktrees-bulk-status-update-tables-6a1b8c/*/scratchpad/mint.cjs`
  (contains no secret; reads them from the env file). Delete minted session files
  after use.
- Local checks: `npx vitest run`, `npx tsc -p tsconfig.app.json --noEmit`,
  `npx eslint src/`. Dev server: `npx vite --port 5199 --strictPort`.

## 9. Open questions and risks

- **Risk — classification changes mail routing.** Once companies become
  ACTIVE/POTENTIAL, the email worker starts matching their mail by domain, alias
  and company name (`workers/crm-worker-supabase.mjs:149`). Expected, but it is a
  behaviour change, not a display change. Flagged as §0 item 6.
- **Open question — what "too small to matter" means operationally** (§0 item 4).
  Until Albert rules, those companies will keep reappearing in Unclassified.
- **Open question — whether the hub prospect fallback should survive at all**
  (§0 item 3). It affects 10 companies today.
- **Risk — a future session repeats the §4 mistake.** Guards in place: the
  business rule (shared-db, merged), the corrected `AGENTS.md` row, a comment
  block on `effectiveCustomerStatus`, and the test
  `'never infers customer-ness from an active ERP account record'` in
  `src/features/crm/pages/_shared.test.ts`. If that test is ever deleted, treat it
  as a red flag.
- **Decision, 2026-08-25:** the CRM classification is authoritative for
  customer-ness; ERP evidence supports but does not decide it. Recorded in
  shared-db PR #1543. Do not contradict without Albert.
- **Unknown:** whether the ColdLion `/orders` endpoint returns enough history to
  rank customers. Nobody has called it. That is §0 item 2 and step 5.
