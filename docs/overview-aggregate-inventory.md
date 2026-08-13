# Overview + Sidebar aggregate inventory (Phase 7A gate 2)

> **Status, 2026-08-12:** the shared-db half of Phase 7A is already built and
> preview-proven. Migrations `20260812130000_crm_overview_server_contracts.sql`
> and `20260812211000_crm_overview_exact_parity_corrections.sql` are merged on
> `u2giants/shared-db` `main` (PR #848) and applied to preview
> `rjyboqwcdzcocqgmsyel`. They are **not** applied to production
> `qsllyeztdwjgirsysgai`; that owner approval is tracked on shared-db issue #851.
> The seven contracts are `api.crm_overview_counts`, `_email_counts`,
> `_pipeline_stages`, `_email_volume`, `_recent_unrouted`, `_recent_meetings`,
> `_pending_approvals`.
>
> Two deliberate differences from this document, decided in shared-db for exact
> display parity: the email contracts **keep** the newest-500-message window
> (§1 defect 1 below is preserved on purpose so Phase 7B changes no displayed
> number), while the 5000-customer cap (§1 defect 2) **is** removed, because the
> new count is a true `count(*)`. Widening the email window is follow-up work
> after Phase 7B, not part of it.

Durable mapping of every value the CRM Overview page and the app sidebar display,
with its source contract, source table, filter, failure boundary, and recent-row
bound. This is the input to the shared-db `db-work` request for Phase 7A; it is
not a design of the SQL itself, which canonical `u2giants/shared-db` owns.

Baseline commit: `c379222`. Sources read:

- `src/features/crm/queries.ts` → `useCrmStatsQuery` (lines 273-289)
- `src/features/crm/pages/OverviewPage.tsx`
- `src/components/app/AppSidebar.tsx`
- `src/features/crm/api.ts` (the seven fetchers)
- `src/features/crm/constants.ts` (`needsRouting`, `isApprovalResolved`, `OPPORTUNITY_STAGES`)

## 1. What happens today

`useCrmStatsQuery` runs seven unbounded list fetches in parallel every 90 seconds,
and both the sidebar and the Overview page compute every number in JavaScript from
those full arrays.

| # | Fetcher | Contract called | Base table | Client-side row cap today |
|---|---------|-----------------|------------|---------------------------|
| 1 | `fetchRetailers(-1)` | `api.crm_customer_segment_list('active', -1)` | `core.customer` (+ `plm.customer_import` logo join) | server caps at **5000** |
| 2 | `fetchBuyers(-1)` | `api.crm_contact_list` (view, unfiltered select) | `core.contact` + `core.contact_company` + `core.company` | none |
| 3 | `fetchOpportunities(-1)` | `api.crm_opportunity_list` (view) | `crm.opportunity` | none |
| 4 | `fetchEmailMessages(-1)` | `api.crm_email_routing_recent(500)` | `crm.email_message` | server caps at **500** |
| 5 | `fetchMeetingNotes(-1)` | `api.crm_meeting_list` (view) | `crm.meeting_note` | none |
| 6 | `fetchTasks(-1)` | `api.crm_task_list` (view) | `crm.task` | none |
| 7 | `fetchApprovalThreads(-1)` | `api.crm_approval_queue` (view) | `crm.licensor_approval_thread` | none |

### Correctness defects this inventory exposes

These are not just performance problems. Two displayed numbers are already wrong
once the data grows past the caps above, and the caps are silent:

- **Email numbers are capped at the newest 500 messages.** "Routing health"
  total, the routed percentage, the donut slices, the "Needs routing" KPI, the
  sidebar `/email` and `/triage` badges, and the whole 12-week volume chart are
  all computed from at most 500 rows. A 12-week window will exceed 500 messages
  long before 12 weeks of history is covered, so the older weeks of the chart
  read low or empty.
- **Customer count is capped at 5000.** `crm_customer_segment_list` clamps its
  limit to 5000, so the "Customers" KPI silently stops growing at 5000.

Phase 7A must therefore restore exact server-side counts, not merely move the
existing arithmetic to the server.

## 2. Value-by-value inventory

Failure boundary column states which independent group the value belongs to, so
one failing group does not blank the whole page.

### Group A — headline counts (KPI strip + sidebar badges)

| Displayed value | Where | Source table | Exact filter | Failure group |
|---|---|---|---|---|
| Customers | Overview KPI | `core.customer` | `customer_status in ('ACTIVE_CUSTOMER','POTENTIAL_CUSTOMER')` | A |
| Contacts | Overview KPI | `core.contact` joined to its company | company `customer_status in ('ACTIVE_CUSTOMER','POTENTIAL_CUSTOMER','OTHER','UNASSIGNED')` (`CUSTOMER_STATUSES`) | A |
| Open programs | Overview KPI | `crm.opportunity` | `stage <> 'CLOSED'` (null stage counts as open today) | A |
| Needs routing | Overview KPI + sidebar `/email` + sidebar `/triage` | `crm.email_message` | `routing_status is not null and routing_status <> '' and routing_status not in ('ROUTED','SKIPPED')` | A |
| Meetings | Overview KPI | `crm.meeting_note` | none, total row count | A |
| Open tasks | Overview KPI + sidebar `/tasks` | `crm.task` | `status not in ('DONE','CANCELED')` (null status counts as open today) | A |
| Approvals | Overview KPI + sidebar `/approvals` | `crm.licensor_approval_thread` | stage NOT matching `/(approv\|reject\|declin\|denied\|complete\|closed\|signed)/i` (case-insensitive, substring) | A |
| Routing health "N messages" | Overview donut subtitle | `crm.email_message` | total row count | A |

Note on the approval predicate: `isApprovalResolved` is a case-insensitive regex
over the free-text stage. The server contract must reproduce that exact substring
set, or the number changes. If `crm.licensor_approval_thread.stage` is in fact a
constrained enum, the shared-db implementer should say so and propose the exact
resolved-stage list instead, and the app side will be aligned in Phase 7B.

### Group B — routing donut

| Displayed value | Source | Filter |
|---|---|---|
| Slice per routing status | `crm.email_message` | `count(*) group by routing_status`, for the six keys `ROUTED`, `COMPANY_ONLY`, `COMPANY_DEPT`, `UNROUTED`, `CUSTOMER_EMAIL_NO_COMPANY`, `SKIPPED`; null status is displayed as `UNROUTED`; zero-value slices are hidden by the client |
| Center "% routed" | derived | `ROUTED / total messages`, rounded |

Failure group B. Needs full-dataset counts, not a 500-row window.

### Group C — 12-week email volume chart

| Displayed value | Source | Filter |
|---|---|---|
| 12 buckets of `ingested` | `crm.email_message` | `received_at` in each rolling 7-day window, newest bucket ending now |
| 12 buckets of `routed` | same rows | `routing_status = 'ROUTED'` |

Buckets are rolling 7-day windows measured back from the current instant, not
calendar weeks, and the bucket label the UI prints is the window end date `M/D`.
Rows with a null `received_at` are excluded. Exactly 12 buckets are always
returned, including empty ones. Time zone: bucket edges are computed today in the
browser's local zone; the server contract must state its zone explicitly and
Phase 7B must match it. Failure group C.

### Group D — pipeline distribution

| Displayed value | Source | Filter |
|---|---|---|
| One bar per stage | `crm.opportunity` | `count(*) group by stage`, for all 8 `OPPORTUNITY_STAGES` in fixed display order; null/empty stage counts into `DIRECTIVE_RECEIVED`; empty stages are still displayed as zero bars |

Failure group D.

### Group E — bounded recent rows

Maximum recent-row count is **6 per panel** as displayed. Request 6 from the
server; do not fetch a page and slice.

| Panel | Source | Filter | Order today | Columns the UI needs |
|---|---|---|---|---|
| Needs routing | `crm.email_message` | needs-routing predicate from Group A | `received_at desc` (add `id` tie-breaker) | `id`, `subject`, `sender`, `routing_status` |
| Recent meetings | `crm.meeting_note` | none | `date desc` (add `id` tie-breaker) | `id`, `name`, `date`, company/customer display label |
| Pending approvals | `crm.licensor_approval_thread` | unresolved predicate from Group A | `stage asc, submitted_date desc` (add `id` tie-breaker) | `id`, `name`, `property_name`, `stage`, opportunity display label |

Every recent panel needs a deterministic `id` tie-breaker; none of the three has
one today.

## 3. Non-goals for Phase 7A

- No frontend change. `useCrmStatsQuery` is replaced in Phase 7B only.
- No production database apply. Phase 7A stops at the preview-proven gate.
- No change to the per-page list contracts (`/email`, `/tasks`, `/customers`),
  which keep their existing paging behavior.
- `useFirefliesHealth` is a separate health endpoint and is out of scope.

## 4. Precedent to follow in shared-db

`api.crm_customer_segment_counts`, `api.crm_contact_segment_counts`, and
`api.crm_email_routing_segment_counts` are the existing shape: `security definer`,
pinned `search_path`, gated on `app.has_app_access('crm')`, revoked from `public`,
granted to `authenticated`, with a `comment on function`. New Overview contracts
should match that and reuse those counts where a number is identical rather than
recomputing it.
