# Architecture — popcrm-web

`popcrm-web` is a static React SPA for POP CRM.

```txt
Browser
  -> https://crm.designflow.app
  -> popcrm-web nginx container
  -> React/Vite SPA
  -> Supabase JS client
  -> https://qsllyeztdwjgirsysgai.supabase.co
  -> shared Supabase/Postgres backend
```

Fireflies integration is handled by a separate worker endpoint:

```txt
Fireflies
  -> https://crm-fireflies.designflow.app/s/fireflies-webhook
  -> popcrm-fireflies container
  -> Supabase CRM tables
```

Important operational note: the Fireflies `/health` endpoint only proves the
webhook server is up. It does not prove Fireflies is delivering webhook events.
On 2026-06-14, the CRM backend had 27 `crm_meeting_note` rows with latest meeting
date `2026-04-14`, while the Fireflies API listed newer transcripts through
`2026-06-11` and worker/proxy logs showed no recent webhook deliveries. Verify
stale ingestion from CRM row dates, worker/proxy logs, and the Fireflies
dashboard webhook configuration.

The frontend has no database and stores no CRM data locally. It uses Supabase
Auth in the browser, then loads the user's CRM profile with
`api.current_user_profile()`.

Opportunity Chat is hosted by the service-role worker, so it independently
verifies the bearer token with Supabase Auth and resolves
`api.current_user_profile()` using that user's JWT. The endpoint reaches
service-role CRM reads only for an active profile with unrevoked CRM access or
the administrator role. It does not trust browser-supplied role/access claims,
and unauthorized requests cannot reveal whether an opportunity exists.

## Data loading

Data loading is page-scoped through TanStack Query hooks in
`src/features/crm/queries.ts`. The app no longer bootstraps every CRM collection
on mount. Until a screen has real server-side pagination/search/filtering plus
true aggregate counts, list queries must load the full relevant dataset through
the paged helpers in `api.ts`. A 2026-06-22 TanStack Query refactor briefly used
hard-coded 50/100/300 row limits and made production screens look empty even
though data was intact. Page-scoped is fine; arbitrary partial slices are not.
High-change surfaces such as Email Routing, Tasks, Meetings, and Notes also use
conservative background refetch intervals.

Reads in `src/features/crm/api.ts` go through browser-safe `api.crm_*` views.
Core customer/contact writes use guarded RPCs (`api.crm_update_customer`,
`api.crm_update_contact`); CRM-owned rows write to `crm.*` tables or narrower RPCs.
Write operations use mutation hooks in `queries.ts`, with optimistic query-cache
updates where the UI already had instant behavior. Related queries are invalidated
after writes so joined view rows reconcile with Supabase.

Contact writes have one extra wrinkle: CRM relationship attributes
(`department`, `contact_type`, `scope`) live on `core.contact_company`, not
`core.contact`. The frontend must send the current customer when editing those
fields so `api.crm_update_contact` can target the correct relationship row. The
2026-06-23 migration
`shared-db/supabase/migrations/20260623024500_crm_update_contact_clear_relationship_fields.sql`
adds explicit `p_clear_*` flags because `null` alone is ambiguous in RPC calls
and the old `coalesce` semantics could not clear values. Until that migration is
confirmed applied everywhere, `updateBuyer` keeps a fallback call using the old
RPC argument shape.

Realtime frontend scaffolding lives in `src/features/crm/realtime.ts`. It listens
for base-table changes, debounces bursty tables, and invalidates the relevant
query keys so the app refetches browser-safe `api.crm_*` views instead of trying
to render raw realtime payloads. Supabase publication/RLS enablement is shared-db
work and must follow `shared-db/AGENTS.md`.

Contacts are intentionally special after the 2026-06-22 incidents. The frontend
uses `api.crm_contact_segment_list` for the Cust Contacts, Dept. Contacts, and
Triage tabs, and `api.crm_contact_segment_counts` for tab counts. The All tab
uses the same segmented view without a segment filter, but it is lazy-loaded only
after the user opens All. Do not reintroduce PostgREST `order('name')` or
server-side `company_customer_status` filters for contact reads: the previous
`security_invoker` view plus derived-field ordering/filtering timed out on the
third paged browser request and made Contacts show all zeroes. The durable
database fix is
`shared-db/supabase/migrations/20260622043000_crm_contact_segments.sql`, which
preserves `api.crm_contact_list`, adds the explicit `app.has_app_access('crm')`
guard, and exposes the server-computed segment/count contracts.

## Data model: customer vs. company vs. ingested domain

The CRM works with three different things that are easy to conflate. They are
not the same and they do not live in the same place. "Company" is not a useful
bucket: factories and licensors are companies too, and those live in
`core.factory` / `core.licensor`.

| Concept | What it is | Storage | Visible to other apps? |
|---|---|---|---|
| Ingested domain | A domain that appeared in ingested email. This is the CRM triage inbox, not a relationship. | `crm.ingested_domain` | No. CRM-private. |
| Potential customer | A company POP is tracking but has not yet done business with. | `core.customer`, `is_potential = true` | Yes. |
| Active customer | A company POP has done business with. The authoritative source is PLM/ERP. | `core.customer`, `is_potential = false` plus a `designflow_plm`/`coldlion` source ref | Yes. |

The Customers page follows this split. **Customers** must read actual customer
rows from customer-scoped API contracts; **Triage** reads
`api.crm_ingested_domain_list` and shows domain evidence plus a promotion action.
A domain becomes a shared `core.customer` row only when someone promotes it with
`crm.promote_ingested_domain(...)`; that promoted row is potential until PLM/ERP
confirms it. Use `is_potential` for the factual "have we done business with
them" signal, and keep `customer_status` as the CRM workflow/status axis.

Naming rule: active CRM code should use `api.crm_customer_list`,
`api.crm_customer_overview`, and `api.crm_update_customer`. Legacy
`api.crm_account_list` / `api.crm_update_account` objects are compatibility names
only until the production rollout is verified and the final drop migration can
remove them. New shared customer reads should use `api.customer_list` or a
CRM-specific `api.crm_customer_*` view, and no screen should use an "all accounts"
path as a proxy for customers. Ingested domains must stay in
`crm.ingested_domain` until promoted.

Lifecycle:

```txt
crm.ingested_domain -> core.customer (potential) -> core.customer (active, same row)
```

The shared hub was hard-renamed from `core.company` to `core.customer` without a
compatibility view. The CRM frontend reads through unchanged `api.*` views/RPCs,
so runtime behavior is shielded from the table rename, but generated
`src/lib/database.types.ts` must be regenerated after the migrated schema is the
target.

## Key modules

| Module | Purpose |
|---|---|
| `src/auth/auth.tsx` | Supabase Auth session plus CRM profile state |
| `src/lib/supabase.ts` | Supabase JS client and Microsoft/Azure OAuth helper |
| `src/lib/database.types.ts` | Generated Supabase schema types |
| `src/lib/types.ts` | Frontend domain types/adapters used by components |
| `src/features/crm/api.ts` | All Supabase view/RPC/table reads and writes |
| `src/features/crm/queries.ts` | TanStack Query keys, full/segmented read hooks, mutation hooks, Fireflies health query |
| `src/features/crm/realtime.ts` | Debounced Supabase Realtime invalidation scaffold |
| `src/features/crm/constants.ts` | Enums, stage lists, tone/status helpers |
| `src/features/crm/format.ts` | Display formatters: `label()`, `formatDate()`, `relatedName()`, etc. |
| `src/features/crm/useRecordSelection.ts` | URL-param-backed record selection (deep links) |
| `src/app/AppLayout.tsx` + `src/app/routes.tsx` | App shell and route-per-page |

## Page components (`src/features/crm/pages/`)

| Page | Route | Notes |
|---|---|---|
| `OverviewPage` | `/` | KPI strip, email volume chart, routing donut, pipeline bar, activity panels |
| `PipelinePage` | `/pipeline` | Board (kanban by stage) + List (DataTable) toggle |
| `CustomersPage` | `/customers` | Customer tabs for real `core.customer` rows: **Customers** (default), **Not a customer**, **All**. **Triage** is a separate ingested-domain review table over `api.crm_ingested_domain_list`, with a promotion action that creates a potential customer. Customer tabs keep inline status/chain edits and `CustomerDrawer`; Triage does not render customer-only edits or drawers. `/accounts` remains a redirect-only legacy bookmark route |
| `DepartmentsPage` | `/departments` | DataTable grouped/sorted by customer. Department-name clicks open `DepartmentDrawer` with assigned contacts and programs |
| `ProgramsPage` | `/programs` | DataTable over CRM opportunities/programs + OpportunityModal |
| `ContactsPage` | `/contacts` | DataTable + ContactDrawer. Segmented tabs: **Cust Contacts** (linked to Active/Potential customer, no department), **Dept. Contacts** (linked to Active/Potential customer and department), **Triage** (not linked to a customer), **All**. Customer inline-edit choices are row-aware |
| `EmailRoutingPage` | `/email` | Segmented tabs (company/dept/program/triage/admin-only all); ignore-rules sidebar |
| `MeetingsPage` | `/meetings` | DataTable + MeetingDrawer |
| `NotesPage` | `/notes` | DataTable + NoteDrawer |
| `TasksPage` | `/tasks` | Board (kanban by status) + List (DataTable) toggle |
| `ApprovalsPage` | `/approvals` | DataTable + ApprovalDrawer |
| `SettingsPage` | `/settings` | AI model config |

## Shared app components (`src/components/app/`)

| Component | Purpose |
|---|---|
| `AppPage` | Page wrapper with scroll container; `listBar` slot for the top toolbar |
| `ListBar` | One-row page header: title · count · optional inline segments · spacer · search · filters · actions; `extra` remains a deliberate second row |
| `DataTable` | Sortable table with column visibility, resize (visible separator), reorder, and optional `groupBy` row group headers. Per-column tools in the header: a persistent filter icon → checkbox **value popover** (set filter), and a quick-**search box with value autocomplete**. Optional inline editing: columns with `editOptions` render click-to-edit dropdowns and a spreadsheet **drag-to-copy** fill handle; `editOptions` may be a static array or row-aware function. Edits persist via the `onCellEdit` prop. Columns with `opensDetail` are the only detail-drawer triggers once any column opts in. Popovers/autocomplete use fixed positioning to escape `overflow:hidden` |
| `CustomerLogo` | Brand logo from logo.dev keyed on `retailer.domain` (token `VITE_LOGODEV_TOKEN`) for compact tokens, stored `logo_url` for full-width logos. `logo_url` can be a CRM manual override or the PLM-imported logo, falling back to `NameAvatar` initials when no usable image exists |
| `DetailDrawer` | Side-sheet shell used by all record drawers |
| `MetricCard` | KPI tile with icon, value, label, optional tone/color, onClick |
| `StatusBadge` | Inline tone-keyed badge (success/danger/warning/neutral/accent) |
| `ChartDonut` | Recharts-backed donut chart with center label |
| `ChartHBar` | Horizontal bar chart for pipeline distribution |
| `ChartAreaVolume` | Area chart for email ingest vs. routed volume (12-week rolling) |
| `CommandSearch` | Global ⌘K search palette |
| `FilterSelect` | Dropdown multi-select for column filters in DataTable |
| `NameAvatar` | Name-hue-derived circular avatar (no image dependency) |

## Domain drawers (`src/features/crm/components/`)

Each drawer is a `DetailDrawer` with domain-specific sections. All support deep-linking via `useRecordSelection` (URL search param).

| Drawer | Key features |
|---|---|
| `OpportunityModal` | Full-screen-capable dialog; board card click; Ask AI scroll, Share clipboard, Expand toggle; composer calls `createNote` |
| `CustomerDrawer` | Logo avatar (`CustomerLogo`) in header, colored status/chain chips, contact list, opportunity list, close button footer |
| `ContactDrawer` | Related customer, opportunity list |
| `DepartmentDrawer` | Department detail panel with core fields, all contacts assigned to that department, and all programs assigned to that department |
| `EmailDrawer` | Mail-header preview band; `MethodConfidence` bar; Apply routing / Create ignore rule actions |
| `MeetingDrawer` | Participant chips (`NameAvatar`), Fireflies transcript tile, action items checklist |
| `TaskDrawer` | Clickable status chips, overdue amber callout, assignee avatar |
| `NoteDrawer` | Source badge, action items checklist, save button |
| `ApprovalDrawer` | Stage select with color-coded status items; licensor comments with left-accent border |

## Design tokens

All color is OKLCH via CSS custom properties in `src/index.css`:

- `--chart-1` … `--chart-5` — chart palette
- `--chip-*` — status chip backgrounds/borders/foregrounds
- `--shadow-xs` / `--shadow-sm` — card shadows
- `--stage-*` — pipeline stage colors
- `color-mix(in oklch, …)` — tinted backgrounds derived from token colors

No ad-hoc hex or Tailwind palette colors in project-owned code.

## Board/list toggle pattern

`PipelinePage` and `TasksPage` both implement a board/list toggle:

- `view` state: `'board' | 'list'`
- Segmented control rendered in `ListBar`'s `actions` slot
- Board: kanban columns rendered as a grid of cards
- List: `DataTable` with full sort/filter support
- `AppPage scroll={view === 'board' ? false : true}` — board manages its own overflow

## Density toggle

`.density-compact` on `<html>`, toggled via `AppHeader` and persisted to `localStorage`. Compact mode tightens padding/font-size via Tailwind variants.
