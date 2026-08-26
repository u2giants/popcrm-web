# POP CRM codebase audit — bugs and inefficiencies

**Audit date:** 2026-08-26
**Baseline:** `u2giants/popcrm-web` `main` at `e5fb235`
**Fixes branch:** `claude/codebase-audit-68jwry` @ `4bb7bcb` — **not merged, not deployed**
**Scope:** `src/**` (React SPA) and `workers/**` (host workers + Fireflies
server). Generated `src/lib/database.types.ts` and the read-only `shared-db/`
mirror were excluded.

This is a follow-on audit to `plan_codebase_audit_remediation.md` (2026-07-26).
The fourteen findings in that plan are not repeated here; everything below is
new. Baseline before any change: `npm run lint`, `npx tsc -b` and
`npm test` (172 tests) all clean.

---

> ### ⚠️ The Part 1 fixes are written and tested, but NOT on `main` and NOT live
>
> They are commit `4bb7bcb` on branch `claude/codebase-audit-68jwry`, one clean
> commit on top of `e5fb235`. This document lives on `main` on its own so any
> session can find it; the code was deliberately left on the branch to be landed
> separately. **Do not re-fix Part 1** — fetch it instead:
>
> ```
> git fetch origin claude/codebase-audit-68jwry
> git log --oneline origin/claude/codebase-audit-68jwry   # 4bb7bcb = the fixes
> ```
>
> Part 2 is untouched in every branch and is genuinely open work.

## Part 1 — Fixed, on branch `claude/codebase-audit-68jwry` (not yet on `main`)

Five findings. All are self-contained app/worker changes with no database
surface, so none of them touch the shared-db gatekeeper. After the changes:
lint clean, typecheck clean, `npm run build` clean, **178 tests passing**
(172 existing + 6 new regression tests).

### 1. Header quick-search filters every row away on a labelled column

**Severity:** user-visible, reproducible today
**File:** `src/components/app/DataTable.tsx:194`
**Affects:** Email Routing — the **Method** and **Status** columns

`DataTable` columns may declare `filterLabel`, which converts a raw stored
value into what the reader actually sees. The filter popover lists labels, and
the header quick-search autocomplete suggests labels:

```ts
// acSuggestions
return distinctValues(autocomplete.key)
  .map((v) => (col?.filterLabel ? col.filterLabel(v) : v))
```

But the row filter compared only the **raw** value:

```ts
if (valueOf && !String(valueOf(row) ?? '').toLowerCase().includes(text.trim().toLowerCase())) return false
```

On `EmailRoutingPage.tsx:210`, Method carries
`filterLabel: (v) => METHOD_LABEL[v] ?? label(v)`, so the row holds
`DETERMINISTIC` while the cell and the suggestion both read `Rule match`.
Typing `rul`, clicking the suggested **Rule match**, and getting **zero rows**
was the exact failure. Typing what the cell visibly shows failed the same way;
only guessing the raw enum worked. Status (`filterLabel: (v) => label(v)`) has
the same defect — `Company + dept` never matches `COMPANY_DEPT`.

**Fix:** the search matches the raw value *or* its label. Raw-value search
still works, so nothing that worked before regressed.

**Test:** `src/components/app/DataTable.headerSearch.test.tsx` — label match,
raw match, and clicking an autocomplete suggestion.

### 2. Unbounded customer feeds silently truncate at the PostgREST row ceiling

**Severity:** latent, silent, and total when it trips
**File:** `src/features/crm/api.ts:457` (`fetchCustomerPickerList`),
`src/features/crm/api.ts:1226` (`fetchCustomerBrands`)

PostgREST enforces a server-side row ceiling (`db-max-rows`). A select with no
`.range()` comes back truncated at that ceiling **with no error** — the
promise resolves, `error` is null, and the caller cannot tell. The worker file
documents this hazard for its own reads:

> `crm-worker-supabase.mjs`: *"PostgREST enforces a server-side row ceiling
> (db-max-rows), so a single `.limit(100000)` silently returns only the first
> page and the rest of the table is never seen. Every full-table read pages
> explicitly instead."*

Every browser-side full-table read follows that rule through `fetchAllRows`.
These two did not:

```ts
// fetchCustomerPickerList — unbounded branch had no .range() and no paging
if (limit >= 0) q = q.limit(limit)
const { data, error } = await q

// fetchCustomerBrands — no .range() at all
.from('crm_customer_list').select('id,name,display_name,domain,logo_url')
```

Blast radius is unusually wide because of who reads them:

- `fetchCustomerPickerList(-1)` backs `useCustomerPickerQuery(-1)`, which feeds
  the customer combobox on **eight pages** (Contacts, DataAdmin, Departments,
  EmailRouting, Meetings, Notes, Pipeline, Programs) and the Customers group in
  global `CommandSearch`. Past the ceiling, customers simply stop appearing in
  every picker in the app.
- `fetchCustomerBrands()` backs `useCustomerBrandMap`, which resolves the logo,
  the domain, **and the display name used for sorting and filtering** in every
  Customer column (`useCustomerDisplayName`). Past the ceiling, affected rows
  fall back to initials badges and their relation labels degrade toward raw ids
  — and they sort under the wrong letter.

The in-code comment on `fetchCustomerBrands` says "small (hundreds of rows)",
which is why this has not bitten yet. It is one ERP import away from biting,
and it fails silently and app-wide when it does.

**Fix:** a shared `fetchAllColumns()` helper (`api.ts:112`) that pages a
narrowed column selection the same way `fetchAllRows` pages `select('*')`.
Both feeds use it for their unbounded path. The bounded path
(`fetchCustomerPickerList(25)`) is unchanged and still asks the server for
exactly that many rows.

**Test:** `src/features/crm/customerFeedPaging.test.ts` — a builder stub that
reproduces the server ceiling, asserting both feeds return all 2,300 rows
across multiple ranges, and that a bounded read does not page.

### 3. `TriagePage` crashes on a contact with no name

**Severity:** whole-page crash from one bad row
**File:** `src/features/crm/pages/TriagePage.tsx:70`

```ts
.sort((a, b) => a.name.localeCompare(b.name))
```

`Buyer.name` is *typed* `string`, but `toBuyer` in `api.ts` constructs it as
`(r.name ?? null) as unknown as string` — the api view genuinely returns null
for a contact with no name, and the double cast hides it from the compiler. A
single nameless contact in the triage queue throws
`Cannot read properties of null (reading 'localeCompare')` inside a `useMemo`,
taking down the whole page rather than one row.

`contactSearchText` in the same file is already safe (`.filter(Boolean)`); only
the sort was exposed.

**Fix:** coerce both sides before comparing.

### 4. `DataTable` silently drops columns a caller adds later

**Severity:** latent foot-gun, no active trigger
**File:** `src/components/app/DataTable.tsx:153`

`colOrder` was seeded once from `columns` in a `useState` initializer, and
rendering filtered strictly by it:

```ts
const [colOrder, setColOrder] = useState<string[]>(() => columns.map((c) => c.key))
const orderedCols = colOrder.map((k) => byKey[k]).filter(Boolean)
```

Any column the caller adds after mount is absent from `colOrder`, so it never
renders — no error, no warning, the column is just gone. It does not bite
today: no page builds a conditional column array, and `CustomersPage` switches
between its two column sets with explicit `key` props that force a remount. It
would bite the first time somebody adds `...(isAdmin ? [ownerColumn] : [])`.

**Fix:** `colOrder` now means "the user's drag-reorder preference", and the
effective order is reconciled with the `columns` prop during render (a
`useMemo`, not an effect — keys the caller no longer passes are ignored, new
ones append). Deriving at render rather than syncing in an effect avoids the
`react-hooks/set-state-in-effect` warning class that
`plan_codebase_audit_remediation.md` finding 12 already had to clean up once.

### 5. Worker re-queries `core.customer` once per message

**Severity:** performance; dominates `reroute` runtime
**File:** `workers/crm-worker-supabase.mjs:302`

`matchingRetailersByDomain` is called for every sender/recipient domain of every
message. `reroute()` walks 12k+ messages (correctly — the July audit fixed its
paging), so this issued 12k+ round trips to resolve a few dozen distinct
domains. `fireflies-server` re-queried the same handful of domains all day.

The file already carries the right tool and the right reasoning for it:

> *"Routing reads the same reference data (ignore rules, the customer list) for
> every single message. That was invisible while a run only ever saw ~1000
> messages; now that paging is fixed, reroute walks 12k+ and the repeat reads
> dominate its runtime."*

`cachedReference` (60s TTL) was already applied to `customers:aliases`,
`customers:names` and `ignore_rules`. The per-domain lookup was missed.

**Correctness note:** the cached value is only the candidate row set, which is
a pure function of `domain` (via `domainCandidates`). The parts that depend on
the individual message — `applySharedDomainRule` reading that message's sender
display names to pick between Ross Stores and dd's — still run per message
against the cached rows. Behavior is unchanged; only the round trip is saved.
`customerForDomain` (contact-sync) is a deliberately separate function with
different ambiguity semantics and was left alone.

**Bounding:** per-domain keys make `referenceCache` grow without limit in the
long-running `fireflies-server`, so `cachedReference` now prunes expired
entries on a miss (`crm-worker-supabase.mjs:138`).

---

## Part 2 — Reported, not changed

These are real, but each needs either a shared-db contract (governed by
`u2giants/shared-db` — app-side DDL is forbidden per `CLAUDE.md`) or a
deliberate behavioral decision. Listed roughly by value.

### A. `CustomersPage` downloads two entire tables to render two count columns

`src/features/crm/pages/CustomersPage.tsx:67-68`

```ts
const buyersQuery = useIngestedContactsQuery(-1)   // every contact, select('*')
const opportunitiesQuery = useOpportunitiesQuery(-1) // every opportunity
```

Both exist solely to build two `Map`s consumed by the Contacts and Programs
count columns (lines 200–213). This is precisely the pattern the July audit
(finding 6) removed from Overview and the sidebar, still present here.

**Proposed fix:** a `crm_customer_relation_counts` aggregate in shared-db
returning `{customer_id, contact_count, opportunity_count}`, consumed like the
existing `crm_overview_*` contracts. Shared-db work first, then the app change.

### B. `useIngestedContactsQuery(-1)` pulls the whole contact table on four pages

`CustomersPage.tsx:67`, `DataAdminPage.tsx:81`, `DepartmentsPage.tsx:26`,
`MeetingsPage.tsx:45`

`fetchIngestedContacts(-1)` → `fetchRows('crm_contact_list', [], -1)` →
`select('*')` over every contact, paged 1,000 at a time. It pages correctly, so
this is cost rather than a correctness bug, but four pages each pay a full
contact-table download to populate comboboxes and labels. A narrowed
`select` (id, name, email, company, department) would cut the payload
substantially with no contract change; a picker-style bounded view would be
better still.

### C. `fetchBuyers` filters server data client-side, so `limit` under-delivers

`src/features/crm/api.ts:704`

```ts
const rows = await fetchRows('crm_contact_list', [], limit)
return rows.filter((r) => CUSTOMER_STATUSES.includes(...)).map(toBuyer)
```

The client-side filter is deliberate and documented (filtering the
security_invoker view through PostgREST times out on derived columns). The
side effect is not: `fetchBuyers(100)` fetches 100 rows and then returns
however many of those happen to be customer contacts — the caller asks for 100
and silently gets fewer. Every current caller passes `-1`, so nothing is
broken today. Either document the contract as "at most `limit`" or push the
filter into a purpose-built view.

### D. Worker `summarize()` scans every email row to find distinct opportunities

`workers/crm-worker-supabase.mjs:976`

```ts
const rows = await fetchAllRows(() => crm('email_message').select('id,opportunity_id').not('opportunity_id', 'is', null))
const ids = [...new Set(rows.map((r) => r.opportunity_id).filter(Boolean))]
```

Pages the full email table (12k+ rows) to derive at most a few hundred ids.
Querying `crm.opportunity` directly, or a distinct-opportunity view, gets the
same list in one bounded read.

### E. Worker `contactSync()` issues one query per address

`workers/crm-worker-supabase.mjs:946`

```ts
const existing = must(await core('contact').select('id').eq('email', address).limit(1))
```

Inside the per-address loop, so thousands of serial round trips per run.
Batchable with a single `.in('email', addresses)` prefetch into a `Set` before
the loop. Same class as finding 5, but in a job that runs less often.

### F. `applyIgnoreRules()` loses `emails_skipped` counts under concurrency

`workers/crm-worker-supabase.mjs:1032`

```ts
must(await crm('ignore_rule').update({ emails_skipped: Number(rule.emails_skipped || 0) + count }).eq('id', rule.id))
```

Read-modify-write against a snapshot read at the start of the run. Two
overlapping runs each write `snapshot + their own count`, so the later write
discards the earlier one's increment. The counter is advisory (it drives a
display column, not a decision), which is why this is reported rather than
fixed. A shared-db RPC doing `emails_skipped = emails_skipped + p_count`
resolves it properly.

### G. `matchOpportunity` fuzzy-scores a PO number with the arguments inverted

`workers/crm-worker-supabase.mjs:384`

```ts
Math.max(fuzzyScore(searchText, r.name), fuzzyScore(searchText, r.production_po_number))
```

`fuzzyScore(query, target)` tokenizes its **first** argument and asks what
fraction of those tokens appear in the target:

```ts
const tokens = String(query || '').toLowerCase().split(/\W+/).filter((t) => t.length > 2)
return tokens.filter((t) => targetLower.includes(t)).length / tokens.length
```

With `searchText` (the whole subject + body) as the query and a PO number as
the target, the score is "what fraction of the entire email appears inside a
5–12 digit PO number" — effectively always 0, so that half of the `Math.max`
never contributes. The `r.name` half works as intended because an opportunity
name is long enough to contain email tokens.

**Not fixed deliberately.** Flipping the arguments changes live routing
outcomes on a threshold of 0.72, and PO numbers already have exact-match
handling earlier in the same function. This needs a decision about whether
fuzzy PO matching was ever wanted, not a silent behavioral change.

---

## Verification

```
npm ci
npm run lint      # clean
npx tsc -b        # clean
npm test          # 20 files, 178 tests passing
npm run build     # clean
```

Nothing in Part 1 touches the database, the shared-db mirror, or any
`api.*` / `crm.*` contract signature. No migration is implied.
