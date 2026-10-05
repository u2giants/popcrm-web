# Intentional quirks and non-obvious decisions

Moved out of AGENTS.md so the always-load guide stays a router. Load this file when behavior looks wrong or surprising.


### Bootstrap loader tolerates a failing collection

Looks like:
`CrmDataContext.load()` uses `Promise.allSettled` and per-collection setters instead of one `Promise.all`.

Actually:
Each Supabase view/table/RPC load runs independently; a failing one leaves its
section empty and a hard error shows only if everything fails.

Why:
A single 403 on one legacy collection previously blanked the entire app. See Critical incidents 2026-06-12.

Do not change because:
Reverting to all-or-nothing makes one bad collection take down every page.

### Commit stamp comes from build args, not git, in CI

Looks like:
`vite.config.ts` reads `process.env.COMMIT_HASH` / `COMMIT_DATE` before falling back to `git`.

Actually:
The Docker build context excludes `.git` (`.dockerignore`), so git is unavailable inside the image build; CI passes the values as Docker build args.

Why:
The app header shows the deployed commit + NYC time; without build args the stamp would be empty in CI builds.

Do not change because:
Removing the env path silently blanks the build stamp in production.

### `crm_licensor_approval_thread.stage` is free-form

Looks like:
There's no `APPROVAL_STATUSES` enum; tone/labels are keyword-matched (`approvalTone`, `isApprovalResolved` in `constants.ts`).

Actually:
The CRM approval `stage` field has no fixed choices, and the collection currently
has 0 rows.

Why:
The real schema differs from earlier assumptions; matching keywords is robust to unknown values.

Do not change because:
Hard-coding an enum would re-introduce the wrong field/value assumptions that caused the 2026-06-12 incident. Verify real values via the backend once approval data exists.

### `customer_status` labels/tones are context-specific — `OTHER` is NOT a global label override

Looks like:
You could add `OTHER: 'Not a Customer'` to `format.ts` `LABEL_OVERRIDES` to relabel it.

Actually:
`OTHER` is a shared enum value — it also means "Other" for `chain_type`, `contact_type`,
and routing. The customer-status relabel/recolor lives in
`constants.ts:customerStatusLabel` / `customerStatusTone` (and `CUSTOMER_STATUS_LABEL`),
used only by the Customers table/drawer — never in the global `label()`.

Why:
A global `OTHER` override would wrongly rename every other column's "Other".

Do not change because:
Putting `OTHER` (or `UNASSIGNED`) into the global `label()` overrides silently
corrupts chain/contact/routing labels. Status colors: green active, yellow
potential, blue New Company (untriaged), gray Not-a-Customer — no red.

### Customers Triage is ingested domains, not customer rows

Looks like:
You could load Customers → Triage from `api.crm_customer_list` rows where
`customer_status` is `UNASSIGNED`.

Actually:
Email-domain noise lives in `crm.ingested_domain` and is exposed through
`api.crm_ingested_domain_list`. Those rows are not customers and should
use the `CrmIngestedDomain` frontend type, not `Retailer`. The Triage table shows
domain evidence and a promote action; it must not render customer-only inline
status/chain edits or `CustomerDrawer`.

Why:
`core.customer` is the shared hub used by CRM, PM, DAM, and PLM. Random email
domains must never become shared customer rows. Promotion was removed entirely
by shared-db migration `20260629034600` (it had polluted the customer list);
ingested domains stay triage-only, and customers are created solely through the
curated customer path. `is_potential = true` still marks a curated customer we
have not yet done business with.

Future sessions should:
Keep customer lists and customer pickers on customer-scoped API contracts
(`api.customer_list` for shared/basic reads, or a CRM-specific
`api.crm_customer_*` view when CRM-owned fields are needed); keep Customers
Triage on `api.crm_ingested_domain_list`. Do not add new `account`-named API
contracts or callers. Existing `api.crm_account_list` / `api.crm_update_account`
objects are legacy compatibility names and should only be dropped after every
deployed client has moved to customer-named contracts. If a frontend change requires a new
view/RPC/policy/trigger, make that change in canonical `/worksp/shared-db` and
document it in the appropriate `u2giants/shared-db` `.md` file, not this repo's
vendored `shared-db/` mirror.

### Customer tabs use server segments

What changed:
Browser verification on 2026-06-28 showed broad
`api.crm_customer_list?select=*` reads and exact counts could still time out
after the account-to-customer contract rename. Migration
`20260629033000_crm_customer_segment_timeout_fixes.sql` adds
`api.crm_customer_segment_list(p_segment, p_limit)` and
`api.crm_customer_segment_counts()`.

Why:
The Customers page needs active, dismissed, and all counts/rows, but the browser
should not page or count the full customer compatibility view. Segment RPCs
filter `core.customer` directly and return the needed rows/counts quickly.

Future sessions should:
Keep Customers page tabs and active customer pickers on
`useCustomerSegmentQuery` / `useCustomerSegmentCountsQuery`. Do not restore
full browser paging or exact head counts against `api.crm_customer_list`.

Amended 2026-08-25: the Customers page now issues ONE
`useCustomerSegmentQuery('all')` read and buckets the rows in the browser
(`segmentOf` in `CustomersPage.tsx`); the Customers / Unclassified / Not a
customer tab counts are those bucket sizes. This is still a segment RPC read —
not full paging of `api.crm_customer_list` — so the timeout rule above holds.
Only the Triage count still comes from `crm_customer_segment_counts`. See
"Customer tab counts must equal the rows the tab renders" below.

### Customer tab counts must equal the rows the tab renders

What changed:
On 2026-08-25 the owner reported the Customers tab reading `73` while the table
showed 27 rows, AT HOME STORES vanishing from Customers, and a row badged
"New Company" (Status) and "Potential" (Source) at once. All three were the
same defect: each tab was fetched by a different query, and the page then
applied extra client-side filters — a hidden `isSelectableCustomer(r.status)`
exclusion — that the server-side counts knew nothing about.

Actually:
There are TWO status axes on a customer row and they are not interchangeable.
`customer_status` is the CRM classification axis (`ACTIVE_CUSTOMER`,
`POTENTIAL_CUSTOMER`, `OTHER`, empty = New Company). `status` is the hub-wide
entity lifecycle (`active` / `inactive` / `potential`) shared with PM, DAM, and
PLM, and it tracks `is_potential`. A row can legitimately have an empty CRM
classification while the hub already tracks it as a prospect — that is exactly
what made AT HOME STORES read "New Company" + "Potential".

The hub axis cannot answer "is this a customer". `status = 'active'` only
means the ERP account record is active: the 2026-07-15 ERP import created 779
companies with `company_type = 'customer'` and `status = 'active'`, and that
set includes vendors, licensors and freight carriers (COLD LION TECHNOLOGIES,
Charles M Schulz Creative Associates, BRYDENS XPRESS). Inferring
ACTIVE_CUSTOMER from it (shipped and reverted 2026-08-25) mislabeled 101
companies. Only the curated `customer_status` says customer; unclassified rows
belong in Unclassified until a person classifies them.

Future sessions should:
Keep one fetch feeding every company tab, derive both the rows and the counts
from the same `segmentOf` predicate, and route every customer-status badge —
table, drawer, anything new — through `effectiveCustomerStatus` rather than
reading `customer_status` raw. Never widen that helper's hub fallback beyond
the explicit `is_potential` prospect flag. Never filter rows out
of a tab by a rule the tab count does not also apply — if ERP-inactive
customers should be hidden again, make it a visible, user-controlled filter,
not a silent one (the silent version hid 46 classified customers).

### Contacts page customer segmentation and customer edit choices

What changed:
Contacts are customer-facing only when their linked customer has
`customer_status` `ACTIVE_CUSTOMER` or `POTENTIAL_CUSTOMER`. `Cust Contacts`
requires that customer and no department; `Dept. Contacts` requires that
customer and a department; all contacts not linked to a customer
belong in `Triage`.

Why:
Contacts linked to reviewed non-customers (`OTHER`) or untriaged customers were
previously appearing in customer/dept sections, which overstated the customer
contact list.

Future sessions should:
Keep `ContactsPage` customer dropdowns row-aware. Customer/dept rows should offer
only Active/Potential customers; triage rows may offer Active/Potential
plus `OTHER` ("Not a Customer") customers so users can classify contacts without
showing every customer in the system.

Likewise the Department dropdown is row-aware (`departmentOptionsFor`): it filters
`crm_department` by the row's selected customer (`idOf(d.retailer) === accountId`),
matching the pattern in `EmailDrawer`. With no customer selected it falls back to
all departments. Changing a row's customer also clears any department that no
longer belongs to the new customer (handled in `editCell`). Previously the
Department column used a single static list of every department regardless of the
chosen customer.

### Contact relationship edits require customer context and explicit clear flags

What changed:
On 2026-06-23, the Contacts page and Data Admin contact cleanup were updated to
send the current customer (`retailer`) whenever editing relationship-owned fields
such as `department`, `contact_type`, or `scope`. Migration
`20260623024500_crm_update_contact_clear_relationship_fields.sql` updates
`api.crm_update_contact` with explicit `p_clear_*` flags so the UI can clear
customer, department, type, and scope values intentionally.

Why:
`core.contact_company.company_id` is required, so department/type/scope edits
must target a specific contact-company relationship row. The previous RPC used
`coalesce`, which made `null` mean "leave unchanged"; Data Admin's "Move and
Clear Type" and inline unassign actions could appear to work optimistically while
the database preserved the old value.

Future sessions should:
Do not remove the frontend fallback to the old RPC shape until the shared-db
migration is confirmed applied in production. When editing relationship-owned
contact fields, include the contact's current customer (or infer it from the
selected department) and use explicit clear flags rather than assuming `null`
will clear a backend value.

### Contacts load by Supabase server segment; avoid derived-field filters/order

What changed:
After the Supabase cutover, Contacts read through browser-safe API views. On
2026-06-22, `shared-db` migration
`20260622043000_crm_contact_segments.sql` preserved `api.crm_contact_list`, added
the explicit `app.has_app_access('crm')` guard, and introduced
`api.crm_contact_segment_list` / `api.crm_contact_segment_counts`. The Contacts
page now fetches Cust Contacts, Dept. Contacts, and Triage as server-computed
segments; All is lazy-loaded only when opened.

Why:
The original `security_invoker` view plus PostgREST ordering/filtering on derived
fields (`name`, `company_customer_status`) timed out during the paged browser
load (page `2000-2999`), so `CrmDataContext` set contacts empty and the UI showed
all contact counts as 0 even though 8,654 contacts existed. Later, trying to cap
contact lists client-side hid most records. Server segments give each visible tab
complete data without forcing the All list to load immediately.

Future sessions should:
Do not re-add server-side `order('name')` or
`.in('company_customer_status', ...)` to contact fetches. Use
`crm_contact_segment_list.crm_segment = customer|department|triage` plus
`crm_contact_segment_counts`; keep table search/sort client-side inside the
loaded segment. `api.crm_contact_list` remains the generic/fallback contract. If
Contacts are zero, test the exact authenticated REST pages and check
`app.profile.auth_user_id` / `app.app_access` before assuming data is missing.

### Customer/vendor pickers label with hub `display_name` and filter hub `status`

What changed:
On 2026-07-17 the shared customer hub gained `core.customer.display_name` and a
three-state `status` (`active` / `potential` / `inactive`; most ERP-imported
rows are inactive), exposed through `api.crm_customer_list` /
`api.crm_account_list` and the `api.crm_customer_segment_list` RPC (shared-db
migrations `20260717122317`, `20260717125909`, `20260717160023`, with trigram
indexes for type-ahead). CRM customer pickers now label options with
`display_name ?? name` and default selectable options to hub-status
active/potential; the legacy `customer_status` axis no longer gates pickers
(except the Contacts triage "(Not a customer)" carve-out).

Why:
The Coldlion ERP import pushed the hub to 859 customers (707 inactive), so
pickers were unusable and showed long legal names.

Future sessions should:
- Build customer option lists with `customerPickerOptions` /
  `customerEditOptions` (+ `withCurrentCustomer` for edit contexts) from
  `src/features/crm/pages/_shared.ts`; labels via `customerLabel` in
  `format.ts` (`relatedName` also prefers `display_name`).
- Feed pickers from `useCustomerSegmentQuery('all', -1)` and filter client-side
  with `isSelectableCustomer(r.status)` — the RPC's `'active'` segment still
  filters the legacy `customer_status` axis and would hide ERP-active but
  CRM-untriaged customers.
- Keep the currently-referenced record reachable: a Combobox's selected label
  comes from its options, so the current (possibly inactive) customer must stay
  in the list; DataTable edit cells render from row data, so filter options
  freely there.
- Vendors (`core.factory`) have no `api.*` view and no picker in this app yet —
  opportunity `factory` is read-only via `crm_opportunity_list`
  (`factory_name`; adapters already pass through `factory_display_name` /
  `factory_status` for when the views expose them).

### Customer Rename edits the visible label, not the canonical name

What changed:
The Customer drawer exposes **Name → Rename**. It writes
`core.customer.display_name` through the guarded
`api.crm_update_customer(..., p_display_name)` contract added by shared-db
migration `20260826001704`. Blank names are rejected in the UI.

Why:
CRM lists and pickers deliberately render `display_name ?? name`. Updating only
`name` would appear to do nothing whenever a short display name exists, and the
underlying name may carry canonical ERP wording that a CRM label edit must not
silently replace.

Future sessions should:
Use `customerLabel` / `relatedName` everywhere a customer is displayed. A normal
CRM rename changes `display_name` only; do not rewrite `name`, customer identity,
classification, aliases, or ERP links as a side effect.

### Email Routing uses a recent feed plus server counts

What changed:
After the customer-contract rename, browser verification showed Email Routing
could still time out because the app paged the full joined
`api.crm_email_routing_queue` view and computed segment counts client-side.
Migration `20260629031500_crm_timeout_fixes.sql` adds
`api.crm_email_routing_recent(p_limit)` and
`api.crm_email_routing_segment_counts()`.

Why:
Production has enough historical emails that a broad joined queue read can hit
PostgREST statement timeouts and leave the UI empty or stale. The recent feed
limits `crm.email_message` first, then joins labels; the count RPC computes full
tab badges server-side.

Future sessions should:
Keep Email Routing's table on `useEmailsQuery(EMAIL_ROUTE_LIMIT)` with a
positive limit, and keep tab badges on `useEmailSegmentCountsQuery`. Do not
restore `useEmailsQuery(-1)` for Email Routing or use full queue paging to
compute counts. Small explicit-limit global search against
`api.crm_email_routing_queue` is still acceptable.

### Not-customer rules are administrative settings

What changed:
The rule editor lives in Settings, not in the Email Routing work queue. Settings
shows separate, always-visible inputs for an exact email address and an entire
domain, plus a separate subject-pattern control. Domain input accepts either
`example.com` or `@example.com` and stores the normalized domain.

Why:
These rules change automated routing behavior for everyone, so they are
administrative configuration rather than a per-message routing action.

Future sessions should:
Keep the editor in `SettingsPage` via `IgnoreRulesPanel`. Address and domain
rules must continue to apply only when an email contains no recognized Customer
domain; a known Customer participant must take precedence over a not-customer
rule.

### Fireflies health does not prove meeting ingestion

What changed:
On 2026-06-14, `/health` for `crm-fireflies.designflow.app` returned 200 and the
`popcrm-fireflies` container was running, but the CRM backend had only 27
meeting-note rows with latest meeting date `2026-04-14`. The Fireflies API listed
newer transcripts through `2026-06-11`, while worker/proxy logs showed no recent
webhook deliveries.

Why:
The health endpoint only proves the webhook server is reachable. It does not
prove Fireflies is configured to send "transcription complete" events to
`https://crm-fireflies.designflow.app/s/fireflies-webhook`.

Future sessions should:
When meeting ingestion is stale, check CRM row dates, `popcrm-fireflies` logs,
proxy logs, and the Fireflies dashboard webhook configuration before debugging
the frontend. Do not assume a green Fireflies badge means notes are ingesting.

### CRM host workers live in this repo

What changed:
On 2026-06-26, the active CRM host worker runtime moved into
`workers/crm-worker-supabase.mjs` in this repo.
Installed systemd units use the templates in `systemd/`, and the
`popcrm-fireflies` container bind-mounts `/worksp/popcrm-web` read-only and runs
the same Supabase worker with `fireflies-server`.

Why:
The CRM backend source of truth is Supabase.com and canonical schema/docs live in
`/worksp/shared-db`. Retiring an old backend must not affect Outlook ingest,
reroute, contact sync, summaries, ignore-rule sweeps, opportunity chat, or
Fireflies ingestion.

Future sessions should:
Keep `/home/ai/.crm-worker.env` out of git. It must include `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`; do not put service-role keys in Vite/browser config.
After changing worker code, run `node --check workers/crm-worker-supabase.mjs`
and relevant one-shot systemd smoke tests. Unknown domains must continue to go
through `crm.record_ingested_domain(...)`, not direct `core.customer` inserts.

### Triage classification writes through an RPC, never the table

Looks like:
`crm.ingested_domain` just needs `GRANT UPDATE ... TO authenticated`, as the
Postgres error message helpfully suggests.

Actually:
Classifying a triage domain failed in production with `permission denied for
table ingested_domain (42501)` because the app updated the table directly.
`ingested_domain` was the ONLY table the app writes that `authenticated` cannot
update — checked with `has_table_privilege`, which unlike
`information_schema.role_table_grants` accounts for inherited and PUBLIC grants;
that view shows zero rows for every `crm` table and is misleading. Taking the
error's advice would have made it the first browser-writable `crm` table and
skipped the `app.has_app_access('crm')` check every other CRM write enforces.

Future sessions should:
Write it through `api.crm_update_ingested_domain(p_ingested_domain_id, p_status)`
(shared-db issue #1516, in production 2026-08-25), which enforces app access and
rejects any status outside `new` / `ACTIVE_CUSTOMER` / `POTENTIAL_CUSTOMER` /
`OTHER`. Status is the only classifiable field. When a browser write fails on
permissions, check `has_table_privilege` before believing the hint, and add an
`api` RPC rather than a table grant.

### Adding a salesperson takes three separate grants

Looks like:
Adding a person to the CRM is one action.

Actually:
Three unrelated systems have to agree, and missing one fails quietly:

1. **Sign-in** — Microsoft SSO. The person must exist in the Azure tenant; no
   app-side signup exists.
2. **App access** — rows in the shared database: `app.profile` for the person,
   `app.user_role` for what they can do, and `app.app_access` granting `crm`.
   Without the `app_access` row every CRM RPC raises `crm: not authorized`,
   because they all check `app.has_app_access('crm')`. There is no admin screen
   for this yet; it is a database change, and roles/apps are shared across CRM,
   PIM, DAM and PLM.
3. **Their mail** — `OUTLOOK_MAILBOXES` in `/home/ai/.crm-worker.env`, a
   comma-separated list read by `resolveOutlookMailboxes` (live since
   2026-08-25: `adweck@popcre.com,jsafdieh@popcre.com`). Each mailbox keeps
   its own Graph delta cursor and is ingested independently, so one failing
   mailbox neither blocks nor rewinds another. Graph also has to allow the app
   registration to read that mailbox. `OUTLOOK_MAILBOX` (singular) still works
   for the original single-mailbox setup.

Ingesting a second mailbox multiplies the routing work: every message is routed
once, so watch the reroute runtime after adding one.

`OUTLOOK_GATED=true` keeps purely internal mail out: a message is stored only if
at least one participant is outside `popcre.com`. **That switch is an interim
stand-in, not the business rule.** The settled rule is in shared-db's business
rule library, `docs/business-rules/email-capture-and-program-linkage.md`: once a
message can be linked to a program (e.g. by subject-line data), that linkage
decides capture and *overrides* the external-participant test — internal-only
mail belonging to a program is valuable and must be ingested. When that is
built, evaluate program linkage FIRST; filtering on external participants first
would discard program-linked internal mail before linkage is ever considered.
Do not read `OUTLOOK_GATED` as a decision that internal email does not belong in
the CRM.

### A parent and its banner share one email domain but stay separate customers

Looks like:
Two customers on one email domain is a duplicate to be merged.

Actually:
Ross Stores and its dd's banner are one company commercially but must stay two
customers in the CRM, and every dd's buyer writes from `@ros.com`. Same shape
applies to any parent/banner pair. Three separate pieces make that work, and all
three must be present or the pair silently mis-routes:

1. **The parent owns the domain.** `core.customer.domain` holds `ros.com` on
   ROSS STORES INC SUPPLIERS only. `domain` must stay unique across customers:
   `core.match_customer` treats an exact domain hit as a confident ERP/PLM link,
   so two customers holding one domain would make that link a coin toss.
2. **The banner carries the domain as a routing alias.** dd's has `ros.com` in
   `routing_aliases`, which makes it a *candidate* for the domain
   (`domainOrClause` searches `domain` and `routing_aliases`) without claiming
   ownership. An alias containing `.` or `@` is deliberately ignored by
   `aliasMatchesSubject`, so a domain alias never leaks into subject matching.
3. **A shared-domain rule picks between the candidates per message.**
   `SHARED_DOMAIN_RULES` in `workers/crm-worker-supabase.mjs` maps
   `ros.com` -> keywords (`DDS`, `DD'S`, `NYBO`) matched against the *sender
   display names* on that message, and name fragments matched against the
   candidate customers. A dd's-branded message routes to dd's; anything else
   falls through to the parent: when the rule does not fire,
   `matchingRetailersByDomain` returns the candidate that owns the domain, and
   null only if nobody owns it. That fallback matters because `reroute` replays
   stored messages, which no longer carry sender display names — without it,
   every historical message on a shared domain would go unrouted the moment a
   banner is added.

Both customers must have `customer_status` of ACTIVE_CUSTOMER or
POTENTIAL_CUSTOMER — every matcher filters on that, so a status-less customer is
invisible to routing no matter how its domain and aliases are set.

Contact sync has no message to judge by, so it never applies the rule: it
assigns contacts to whichever customer owns the domain outright, and logs and
skips the domain if no one owns it. Adding a banner therefore never silently
re-parents existing contacts.

Merging customers is a real button: tick two or more rows on the Customers grid
and press Merge. Pick one survivor; every other selected row is preflighted and
then merged into it through `api.db_data_admin_preview_customer_merge` and
`api.db_data_admin_merge_customer`, with a fresh preview token and operation id
for each pair plus one typed reason. The engine moves contacts, email, programs
and ERP source references onto the survivor, keeps discarded names as aliases,
and writes audit rows. If a later merge fails, completed merges remain complete
and the dialog explicitly reports how many succeeded; untouched rows remain.
Two gates live outside this repo and are reported as result codes, not thrown
errors: the caller needs the `administrator` role plus explicit `admin` app
access (`app.require_db_data_admin_access`), and the
`app.db_data_admin_feature_gate` row for `merge_execute` must be enabled. The
dialog explains both in plain language rather than failing silently.

Consolidating routing onto one customer does not require a database merge:
`domain` holds one domain, and `routing_aliases` (editable in the customer
drawer) holds any number more. Both are searched by `domainOrClause`, so a
second domain added as an alias routes its email to that customer. An alias
containing `.` or `@` is domain matching only; a plain word is subject matching
only. The merge UI is for true duplicate records, not routing consolidation.

Future sessions should:
Add a new pair by setting the parent's `domain`, adding the same domain to the
banner's `routing_aliases`, giving both a customer status, and adding a
`SHARED_DOMAIN_RULES` entry keyed on how the banner's people actually sign their
mail. Verify with `workers/shared-domain-rules.test.mjs`. Never solve it by
putting the same `domain` on both customers, and never merge the two records.

### Full-table worker reads must page, and Customer domain is curated by hand

Looks like:
`crm('email_message').select(...).limit(100000)` reads the whole table.

Actually:
PostgREST caps any single response at its `db-max-rows` ceiling, so that call
silently returned only the first ~1000 of 16999 messages. `contact-sync` had
been evaluating 271 of 1453 addresses every night, and hundreds of sender
domains (including `lidl.us`, a real customer with 104 emails) never reached
Triage. `reroute`, `summarize`, and `apply-ignore-rules` read the same way.

Future sessions should:
Use `fetchAllRows(() => crm('table').select(...))` in
`workers/crm-worker-supabase.mjs` for every full-table read. It pages by
**keyset** (`.order(id).gt(id, last).limit(n)`), not offset: `reroute` and
`applyIgnoreRules` update the very rows their own filter selects, and under
offset paging each committed update shifts later rows up one offset, so the job
skips exactly as many rows as it just changed. `ROW_PAGE_SIZE` stays below the
server ceiling so a short page always means end-of-table, never a silent
server-side truncation.

Fixing the cap made the batch jobs much bigger, and two things had to follow.
`reroute` now walks ~12.8k messages instead of ~1k and blew through its 30-minute
`TimeoutStartSec` mid-run (`systemd/popcrm-reroute.service`, now 3h). And
`routeEmail` re-read the ignore rules and the whole customer list *per message*,
which was invisible at 1k messages and dominant at 12.8k, so reference reads go
through `cachedReference` with a 60-second TTL. When changing a job's coverage,
re-check its unit timeout and its per-row query count. Never reintroduce a bare high `.limit()` as a way to
"get everything". After a change, run one-shot `systemctl start popcrm-<job>` and
check the job's own counter line in `journalctl` against a `count(*)` in the
database — a suspiciously round or small evaluated count means the cap is back.

Clearing a Customer domain writes an **empty string**, not `null`:
`api.crm_update_customer` coalesces every argument, so `null` means "leave
unchanged" and there is no way to express "clear it". Verified harmless inside
this app — `core.match_customer` uses `nullif(...)` on the probe, the worker's
contains-ilike never matches an empty stored value, and every frontend check is
falsy-based — but unverifiable for PM/DAM/PLM, which share `core.customer`.
Tracked as shared-db issue #1615 (add `p_clear_domain`, following the
`p_clear_*` precedent from `20260623024500`); until it lands, do not write code
that treats `domain is not null` as "has a domain".

`core.customer.domain` is stored bare (`target.com`), never scheme-prefixed.
64 legacy rows held `https://target.com`, which still matched the workers'
contains-ilike routing but could never match `core.match_customer`'s exact
domain compare, so ERP/PLM auto-linking silently failed for every one of them.
The Domain input normalizes scheme, `www.`, path, and a pasted address away,
and rejects anything that is not domain-shaped.

`core.customer.domain` stays human-curated: it is editable in the customer
drawer (`DomainField`), and `suggestDomainFromEmails` proposes the most common
domain among that customer's own contacts as a one-click accept. The suggestion
never writes on its own, and ingested domains still never write to
`core.customer`.

### Customer logos use token domains plus optional full-logo overrides

Looks like:
Logos might have been migrated from Twenty as uploaded files.

Actually:
Twenty's `company` table has **no logo/avatar/image column** — Twenty rendered
logos live from each company's domain via its `twenty-favicon` service. There was
nothing to migrate from Twenty. Compact token logos prefer the stored
`logo_url` when one exists (an upload is an explicit human override) and
otherwise come from `img.logo.dev` keyed on `retailer.domain` (token
`VITE_LOGODEV_TOKEN`); a stored logo is `object-fit: contain` inside the round
mark so wordmarks are not cropped. Until 2026-08-26 the round mark ignored
`logo_url` entirely, so brands logo.dev does not know (Ross / `ros.com`) kept
showing the initials placeholder after a successful upload. Full-width
logos come from `api.crm_customer_list.logo_url`, which prefers the CRM manual
override stored at `core.customer.metadata.crm_logo_url` and falls back to the
PLM-imported `plm.customer_import.logo_url`. The Data Admin → Logos tab can
upload full logos to the `crm-customer-logos` Supabase Storage bucket, save a
full logo URL, clear the override, or update the token-logo domain. Since
2026-08-25 the same upload / URL / remove actions also live in the customer
drawer (`CustomerLogoField`), so a logo can be changed from any customer record
without going through Data Admin.
The publishable logo.dev token is stored in 1Password at
`op://vibe_coding/logo.dev publishable token - popcrm-web/password` and mirrored
to the GitHub Actions secret `LOGODEV_TOKEN`.

Why:
The user's "uploaded" Twenty logos never existed as stored files; domain-derivation
is the same mechanism Twenty used.

Do not change because:
Don't go looking for legacy Twenty logo files — there weren't any. Preserve the
two-layer contract: token domain on `core.customer.domain`; full logo URL from
CRM override first, then PLM import. Do not write CRM uploads back into
`plm.customer_import`.

### The Customer column renders and sorts from an unfiltered brand map

What changed:
On 2026-08-25 every Customer column was made identical to the Customers page —
logo plus the spelled-out name (`CustomerRelationLogo variant="token-name"`).
Two things had to be fixed for that to actually work:

- **Logos.** The row-level list views (`api.crm_contact_list`,
  `crm_department_list`, `crm_email_routing_queue`, …) do **not** expose
  `company_domain`, and `fetchCustomerPickerList` hard-codes `domain: null` /
  `logo_url: null`. The segment feeds only carry curated active/potential
  customers. So a row linked to an ERP-only customer (TRANSWORLD ENTERTAINMENT,
  display name FYE, domain `fye.com`) drew an initials badge even though the
  link and the domain were both correct. `CustomerRelationLogo` now resolves
  domain/logo/display name through `useCustomerBrandMap()`
  (`fetchCustomerBrands` → unfiltered `api.crm_customer_list`, ~800 rows).
- **Sorting.** Columns sorted on the legal name, so FYE sorted under T. Retailer
  `sortValue` / `filterValue` / search text now go through
  `useCustomerDisplayName()`, and the Customers/Data Admin name columns use
  `customerLabel`.

Why:
An initials badge on a linked row reads as "the link is broken" when the link is
fine — the display layer simply could not see the domain.

Future sessions should:
- Resolve any customer relation's on-screen name with `useCustomerDisplayName()`
  and never sort or filter on `name` directly; `display_name` is what the reader
  sees.
- Reach for `useCustomerBrandMap()` (not the picker or segment feeds) whenever a
  screen needs a customer's domain or logo — those feeds are deliberately
  filtered and drop `domain`.
- Leave `customerById` props alone: they still supply names for rows the brand
  map has not loaded yet.

### Supabase profile links control whether signed-in users see CRM rows

What changed:
During the 2026-06-22 contacts incident, the imported data was present but a
signed-in user with no linked `app.profile.auth_user_id` saw empty CRM lists.
Linking the existing `app.profile` row to the Supabase Auth user and confirming
`app.app_access` for `crm` restored access. On 2026-07-03, Microsoft SSO for
some users failed before the app rendered with Supabase Auth's
`Database error saving new user` callback error because pre-seeded
`app.profile` rows had unique emails but no `auth_user_id`. A follow-up case for
`adweck@popcre.com` had the same callback error because the CRM profile email was
linked to an older Google Auth user with a different email.

Why:
RLS and API views are app-access gated. Supabase Auth can authenticate a browser
session while the CRM profile/app-access mapping is still missing or stale. The
first-login auth trigger must link imported profiles by email before inserting a
new profile, otherwise `app.profile.email` can collide and abort `auth.users`
creation. It must also relink same-email CRM profiles when their existing
`auth_user_id` points at an Auth user whose email does not match the CRM profile
email.

Future sessions should:
If one user sees zero records while service-role counts are nonzero, verify
`auth.users.id -> app.profile.auth_user_id` and the user's `app.app_access` row
for `crm` before debugging frontend filters or rerunning imports. If Microsoft
SSO redirects back with `error_description=Database error saving new user`, check
the shared-db migration `20260703172500_fix_crm_auth_profile_email_link.sql`,
follow-up migration `20260703220000_fix_crm_auth_profile_mismatched_email_relink.sql`,
the `app.handle_new_auth_user()` trigger function, and whether the user's
`app.profile.email` is unlinked or linked to an Auth user with a different email.

### Admin impersonation is a frontend "view as", not a data-layer switch

Looks like:
Impersonation might run queries under the target user's Supabase session so RLS
returns their rows.

Actually:
It is a **frontend identity overlay**. `src/auth/auth.tsx` keeps the real
signed-in account (`realUser`) and, when an admin impersonates, an
`impersonating` `AppUser`; `useAuth().user` returns `impersonating ?? realUser`.
The Supabase session never changes — the admin's own JWT still authorizes every
request. This is correct here because CRM `api.crm_*` list views gate on **app
access**, not per-user row ownership: every crm-access user sees the same shared
rows. The only things that vary per user are the rendered identity and
role-gated UI (e.g. Email Routing's `canSeeAll = /admin/`), and those read
`useAuth().user`, so the overlay reproduces them faithfully. Impersonation is
admin-only (`isAdmin` from `realUser.roles`), persisted per tab in
`sessionStorage` (`popcrm_impersonate`), and cleared on stop/logout.

The user list comes from the admin-gated `api.crm_admin_user_list()` RPC in
canonical `/worksp/shared-db` (migration
`20260715184500_crm_admin_user_list.sql`) — the browser cannot read the `app`
schema directly, so identity listing must go through an `api` function. A
follow-up migration `20260715223108_crm_admin_user_list_exclude_service_accounts.sql`
filters service/test accounts (`%@example.com`, `svc@%`, `codex%`, `%e2e%`) out
of that RPC so the picker lists only real people; extend the denylist there
(server-side), not in the frontend.

Do not change because:
Adding a real per-user session switch (service-role or minted JWTs) would be a
large, security-sensitive backend build that returns identical rows anyway,
since the data is shared. If per-user row scoping is ever added to the CRM
views, revisit whether the overlay still reflects reality.

Admin emails:
`app.handle_new_auth_user()` auto-grants the `administrator` role to
`u2giants@gmail.com` and `albert@popcre.com` on first SSO login (same migration
also backfilled albert's existing profile). Impersonation and any other
administrator-gated capability follow the DB role, not a frontend allowlist.

### `src/components/ui` is hand-maintained, imports from `radix-ui`

Looks like:
Standard shadcn output you could regenerate with the CLI.

Actually:
Primitives are hand-authored here and import from the unified `radix-ui` package (e.g. `import { Dialog } from "radix-ui"`), not `@radix-ui/react-*`.

Why:
Matches the existing primitives and the installed dependency set.

Do not change because:
Running `npx shadcn add` may rewrite these with a different import style and break the build.

### `VITE_*` is build-time, not runtime

See Credentials and environment / `docs/deployment.md` — a static SPA bakes config at build, so there is no Coolify runtime env for app config.

### DataTable horizontal scroll can be caused by header resize handles

What changed:
On 2026-06-30, Data Admin's department table showed a horizontal scrollbar even
when there was visible empty page space. Two causes overlapped: the page body was
capped at `max-w-6xl`, and `DataTable` rendered as `w-max` with resize handles
positioned `right-[-4px]`, making the last header cell overflow by 4px.

Why:
The table was being squeezed inside an artificially narrow centered wrapper; the
off-cell resize handle then created a scrollbar even when the table otherwise
fit.

Future sessions should:
Keep wide table pages full-width unless there is a deliberate readability reason
to cap them. If a table scrollbar looks unnecessary, verify with Playwright by
comparing the table wrapper's `clientWidth` and `scrollWidth`; do not trust the
visual screenshot alone. Current intended behavior is `DataTable` tables use
`min-w-full`, and resize handles stay inside header cells (`right-0`).

