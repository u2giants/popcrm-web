# Live Data Implementation Plan

## Background

POP CRM is now backed by Supabase, which should be treated as the live system of
record for CRM operations. The current frontend has been migrated to Supabase at
the API layer, but the data-loading model still behaves like the older
snapshot-style app: `CrmDataContext` fetches many CRM collections during a global
bootstrap, stores them in React state, and exposes a manual "Refresh CRM data"
action to rerun that bootstrap.

That creates the wrong product feeling. Staff experience the CRM as if it is
importing or syncing data from another system, even though Supabase is now the
backend. The goal is to make the app feel live, immediate, and native to
Supabase:

- The shell should appear immediately.
- Pages should show existing data while quietly refreshing.
- User edits should update the UI instantly.
- Other users' changes, webhook updates, and automation output should appear
  without a manual refresh.
- The refresh button should become a fallback, not part of normal workflow.

This does not mean the browser holds no state. Every web app keeps a local
working set for rendering tables, drawers, filters, counts, and selected records.
The change is that local state should be small, page-scoped, cached, and kept in
sync with Supabase instead of acting like a manually refreshed copy of the whole
CRM.

## Current State

- Supabase client configuration lives in `src/lib/supabase.ts`.
- CRM reads and writes are implemented in `src/features/crm/api.ts`.
- Reads go through `api.crm_*` views.
- Operational writes go to `crm` tables or guarded `api` RPCs.
- `src/features/crm/CrmDataContext.tsx` still performs one global load of many
  collections.
- `AppHeader` exposes a manual refresh button that calls the global loader.
- Many pages depend on globally preloaded arrays from `useCrmData()`.
- `CrmDataContext` also exposes raw React setters such as `setTasks`,
  `setEmails`, and `setOpportunities`. Several consumers already use those
  setters for hand-rolled optimistic updates, so the migration is not just about
  reads; existing write/update behavior must be moved deliberately into mutation
  hooks.

This architecture makes initial navigation heavier than necessary and makes
freshness depend on a manual action.

## Target Experience

The app should feel like this:

1. A signed-in user lands in the CRM and sees the app frame immediately.
2. The current page loads only the data it needs.
3. If cached data exists, it remains visible while a background request checks
   for newer data.
4. When the user edits a record, the visible row/drawer updates immediately.
5. When Supabase reports a relevant table change, the affected page quietly
   refetches the relevant browser-safe view.
6. Dashboard counts and command search update in the background without blocking
   normal work.
7. Manual refresh remains available for recovery, but users rarely need it.

## Design Principles

- Supabase is the source of truth.
- The browser keeps only the active working set live.
- Page data should be independent; one slow collection must not block the rest
  of the app.
- Existing data should not disappear during refreshes.
- Writes should be optimistic where the failure behavior is easy to explain and
  easy to roll back.
- Realtime should be applied selectively to high-change surfaces instead of
  streaming every table into every browser.
- API views may be refetched after realtime events because Supabase Realtime
  generally emits changes from base tables, not derived view rows.
- Realtime event payloads should not be used as the rendered CRM row shape when
  the UI depends on joined fields from `api.crm_*` views.
- The implementation should preserve the existing security model: browser-safe
  reads through `api` views, RLS-enforced writes through `crm` tables or guarded
  RPCs.

## Implementation Phases

### Phase 0: Audit Context Coupling

Before migrating the first page, audit every `useCrmData()` consumer and
categorize it as read-only or setter-using.

Current inventory from the codebase:

- Read-only or derived global data consumers:
  - `src/components/app/AppHeader.tsx`
  - `src/components/app/AppSidebar.tsx`
  - `src/components/app/CommandSearch.tsx`
  - `src/features/crm/components/AccountDrawer.tsx`
  - `src/features/crm/components/ContactDrawer.tsx`
  - `src/features/crm/components/DepartmentDrawer.tsx`
  - `src/features/crm/pages/ApprovalsPage.tsx`
  - `src/features/crm/pages/DepartmentsPage.tsx`
  - `src/features/crm/pages/OverviewPage.tsx`
  - `src/features/crm/pages/PipelinePage.tsx`
  - `src/features/crm/pages/ProgramsPage.tsx`
- Setter-using consumers that must migrate with their mutation behavior:
  - `src/features/crm/components/ApprovalDrawer.tsx`
  - `src/features/crm/components/EmailDrawer.tsx`
  - `src/features/crm/components/NoteDrawer.tsx`
  - `src/features/crm/components/OpportunityDrawer.tsx`
  - `src/features/crm/components/OpportunityModal.tsx`
  - `src/features/crm/components/TaskDrawer.tsx`
  - `src/features/crm/pages/AccountsPage.tsx`
  - `src/features/crm/pages/ContactsPage.tsx`
  - `src/features/crm/pages/DataAdminPage.tsx`
  - `src/features/crm/pages/EmailRoutingPage.tsx`
  - `src/features/crm/pages/MeetingsPage.tsx`
  - `src/features/crm/pages/NotesPage.tsx`
  - `src/features/crm/pages/SettingsPage.tsx`
  - `src/features/crm/pages/TasksPage.tsx`

The compatibility-wrapper strategy only applies cleanly to read-only consumers.
A query-cache-backed wrapper cannot faithfully re-expose arbitrary
`setTasks(prev => ...)` / `setEmails(prev => ...)` functional setters without
creating a second cache system. Setter-using pages/components should be converted
to query + mutation hooks in the same PR that migrates their data reads.

### Phase 1: Remove the Global Loading Bottleneck

Replace the all-CRM bootstrap with page-scoped, bounded data loading.

- Introduce a small query/cache layer for CRM data.
- Prefer TanStack Query unless there is a strong reason to keep a custom cache.
- Give each page its own query keys, for example:
  - `crm.accounts.curated`
  - `crm.accounts.all`
  - `crm.contacts.curated`
  - `crm.emailRouting.queue`
  - `crm.tasks.list`
  - `crm.meetings.list`
  - `crm.opportunities.list`
- Add server-side pagination and filtering to list queries during the first
  migration pass. "Page-scoped" must mean a bounded slice, not "fetch every row
  for this one collection."
- Historical note: the original default page-size starting points below caused a
  production regression when implemented without server-side totals/search.
  Do not reuse them unless the corresponding API contract exists:
  - Email Routing: 50 newest queue rows, with server-side segment/status/search
    filters.
  - Tasks: 100 active or filtered rows, with server-side status/search filters.
  - Meetings: 50 most recent rows, with server-side customer/triage/search
    filters.
  - Notes: 50 most recent rows, with server-side search and relation filters.
  - Customers and Contacts: 100 rows per segment/search result.
  - Opportunities/Programs: 100 rows per board/list filter, with stage and
    customer filters sent to Supabase.
  - Departments, approvals, AI config, and ignore rules: bounded where practical,
    but allowed to remain simple only while their record counts are known to be
    small.
- Keep previous data visible while refreshing.
- Move global stats to their own lightweight queries instead of deriving all
  counts from globally loaded arrays.
- Keep `CrmDataContext` temporarily as a read-only compatibility wrapper during
  migration, then delete it once pages no longer depend on global arrays. Do not
  add query-cache-backed raw setters to the wrapper.

Expected result:

- The app shell renders immediately.
- Navigating to one page does not require loading every CRM collection.
- Opening a page fetches only the bounded server-side slice needed for the
  current view, page, segment, and filters.
- "Loading..." becomes local and brief, not a whole-app state.

### Phase 2: Move Existing Optimistic Writes Into Mutation Hooks

The app already has optimistic writes, but they are hand-rolled through raw
`CrmDataContext` setters. Phase 2 relocates that behavior into explicit mutation
hooks.

- Replace each setter call site with a domain mutation hook.
- Preserve the existing user-visible behavior where edits already update
  immediately.
- For inline table edits, update the matching query cache row immediately.
- For drawer edits, update both the selected record cache and the list row cache.
- For create actions, insert the returned adapted row into the relevant cache and
  invalidate any affected count/search queries.
- For drag/status changes, keep the existing optimistic patch-before-await
  behavior.
- On write failure, revert the optimistic patch and show a clear toast.
- Invalidate related queries after writes so views and derived fields reconcile
  with Supabase.

Expected result:

- A user action appears to complete immediately.
- Manual refresh is not needed after editing a task, routing an email, or
  changing a customer/contact field.

### Phase 3: Add Background Freshness

Make the app quietly refresh at natural moments.

- Refetch active page queries when the browser window regains focus.
- Refetch active page queries after reconnecting from offline/network loss.
- Add conservative background intervals for high-change pages:
  - Email Routing: frequent enough to catch new queue items quickly.
  - Tasks: moderate interval.
  - Meetings and notes: moderate interval.
  - Customers/contacts/opportunities: slower interval or focus-only.
- Avoid replacing visible data with loading placeholders during background
  refetches.
- Add a small non-blocking "updated" or "syncing" affordance only if users need
  feedback.

Expected result:

- Users who leave a tab open see current data when they return.
- Webhook- and worker-created records appear without a manual refresh.

### Phase 4: Add Supabase Realtime for High-Value Tables

Use Supabase Realtime to trigger targeted refetches or patches.

This phase has a shared-db prerequisite. Enabling Realtime on `crm.*` or shared
`core.*` tables touches the Supabase publication and the realtime role/RLS
authorization model, so it must go through the canonical `u2giants/shared-db`
branch + PR workflow described in `shared-db/AGENTS.md`. Do not plan Phase 4 as
pure frontend work.

Start with tables that change often or where freshness is operationally
important:

- `crm.email_message`
- `crm.task`
- `crm.meeting_note`
- `crm.note`
- `crm.opportunity`
- `crm.department`
- customer/contact source tables in the shared core schema, if exposed to
  Realtime and allowed by policy

Implementation approach:

- Create a small realtime subscription module, for example
  `src/features/crm/realtime.ts`.
- Subscribe only while the relevant page or app section is mounted.
- On insert/update/delete events, invalidate the matching page query.
- Debounce bursts of events to avoid refetch storms. Initial windows:
  - `crm.email_message`: 1,000-1,500 ms, because webhook/worker ingestion can
    arrive in bursts.
  - `crm.task`, `crm.note`, `crm.meeting_note`: 500-1,000 ms.
  - `crm.opportunity`, `crm.department`, customer/contact source tables:
    750-1,500 ms.
- Prefer refetching the relevant `api.crm_*` view for correctness, because the
  event payload may not contain joined display fields.
- Keep polling/focus refresh as a fallback even after Realtime is added.

Expected result:

- Other users' changes and automation output show up naturally.
- The app feels live without trying to mirror the entire database in memory.

### Phase 5: Make Dashboard and Search Lightweight

The dashboard and command search should not require loading every operational
record.

This phase also has a shared-db prerequisite if it needs new aggregate views,
search views, or RPCs. Those schema/API additions belong in `u2giants/shared-db`
and must follow its branch + PR process before the frontend depends on them.
Document the database change as part of that PR, not after it. The shared
database is used by CRM, PIM, DAM, and the Directus/worker stack, so undocumented
views/RPCs become production risk for other sessions. The shared-db PR must
include:

- The migration SQL with comments explaining the contract, access model,
  indexes, and why the change is additive.
- Updates to the canonical schema design docs in `u2giants/shared-db`, especially
  `docs/unified-supabase-schema-map.md` and any relevant relationship or
  implementation notes.
- An app-facing contract note covering view/RPC names, columns, segment/count
  semantics, auth/RLS behavior, and which apps are expected to consume it.
- A verification note with preview project checks, exact SQL/count comparisons,
  authenticated REST checks, and rollback/fallback instructions.
- A frontend rollout note explaining when `popcrm-web` may depend on the new API
  and how older frontend bundles continue to work while the migration rolls out.
- PR description detail sufficient for a future AI session to understand the
  moving parts without rediscovering them from SQL.

- Add or use lightweight aggregate endpoints/views for dashboard counts.
- Keep recent activity panels as bounded queries.
- Build command search from dedicated search queries or small cached slices,
  not from a global all-record preload.
- Load search data lazily when the command palette opens, then cache it.

Expected result:

- Overview loads quickly.
- Search remains fast without forcing global CRM data into memory at startup.

### Phase 6: Remove or Reframe Manual Refresh

Once page-scoped loading, background refresh, and realtime are working:

- Remove "Refresh CRM data" as a primary header action, or move it into a
  lower-priority menu as "Sync now".
- If retained, make it invalidate active CRM queries rather than rerun a global
  bootstrap.
- Replace global loading state with per-query pending/background states.
- Move the Fireflies webhook health check out of `CrmDataContext` before deleting
  the context. Recommended home: a small `useFirefliesHealth()` hook under
  `src/features/crm/` consumed by `AppHeader`, `AppSidebar`, `OverviewPage`, and
  `SettingsPage`.

Expected result:

- Users no longer feel responsible for keeping CRM data current.
- Refresh becomes a recovery tool, not normal workflow.

## Suggested Technical Shape

Use a query client as the center of frontend data freshness:

- `QueryClientProvider` at the app root.
- CRM query hooks close to the CRM feature, for example:
  - `useAccountsQuery()`
  - `useContactsQuery()`
  - `useEmailRoutingQuery()`
  - `useTasksQuery()`
  - `useMeetingsQuery()`
  - `useOpportunitiesQuery()`
- Mutation hooks for writes:
  - `useUpdateAccountMutation()`
  - `useUpdateContactMutation()`
  - `useUpdateTaskMutation()`
  - `useUpdateEmailMessageMutation()`
- Realtime subscriptions invalidate query keys rather than directly rewriting
  every UI shape.

Recommended defaults:

- `staleTime`: short for operational queues, longer for low-change reference
  data.
- `gcTime`: long enough to make back/forward navigation instant.
- `refetchOnWindowFocus`: enabled.
- `placeholderData` / previous data: enabled for list pages.
- `retry`: conservative, with visible error states for page-level failures.

## Superseded Limit Guidance

The original plan below proposed 50/100-row page slices before the CRM had
server-side pagination/search/filtering and true aggregate count contracts. That
caused the 2026-06-22 live-query refactor regression: Customers, Email Routing,
Pipeline/Programs, Notes, Tasks, drawers, overview stats, and command search
showed partial datasets as if they were complete.

Future work should treat the old row-count suggestions as historical only. A CRM
screen may use bounded queries only when the backend/API contract also returns
the correct total/segment counts and performs the search/filtering server-side.
Otherwise use full paged reads (`limit = -1`) or explicit full segment reads, as
Contacts and Customers now do for their primary tabs.

## Risks and Constraints

- Setter coupling is the top migration risk. Existing consumers use raw
  `CrmDataContext` setters for optimistic updates, rollbacks, and created-row
  insertion. Those call sites cannot be safely hidden behind a read-only
  compatibility wrapper; they must move to mutation hooks with their migrated
  page/component.
- Page-scoped queries must either represent the full dataset shown by the UI or
  be backed by a server-side pagination/search/count contract. Do not cap a
  client-filtered table and still label it "All" or use it for tab counts.
- Phase 4 Realtime enablement requires a shared-db PR for publication and
  realtime authorization/RLS changes.
- Phase 5 aggregate/search endpoints require a shared-db PR when new views or
  RPCs are needed.
- Supabase Realtime must be enabled for the relevant tables.
- Realtime authorization and RLS behavior must be verified for each schema/table.
- Events from base tables may not include joined fields from the `api` views.
- High-volume tables can create noisy realtime traffic if subscriptions are too
  broad.
- Some existing pages assume all CRM arrays are globally available; migration
  should be incremental to avoid a large risky rewrite.
- Documentation still contains Directus-era language and should be updated as a
  separate cleanup so future contributors do not make the wrong architectural
  assumptions. The code comments should be swept at the same time, including old
  "Directus permission gap" wording in `CrmDataContext`.

## Acceptance Criteria

- Initial signed-in shell renders without waiting for all CRM collections.
- Opening a page fetches only the bounded server-side slice required for the
  current page, segment, filters, and search.
- Navigating back to a previously visited page shows cached data immediately.
- Editing a row or drawer updates the visible UI without clicking refresh.
- New email-routing items and task updates appear through background refresh or
  realtime.
- Manual refresh is no longer needed during normal CRM operation.
- No page returns to the old all-or-nothing global loading behavior.
- Existing RLS and browser-safe view boundaries remain intact.

## Proposed Rollout Order

1. Audit every `useCrmData()` consumer and confirm whether it is read-only or
   setter-using.
2. Add the query/cache foundation and migrate one low-risk read-only page with
   bounded server-side fetching.
3. Convert the first setter-using page to query + mutation hooks in one PR.
4. Migrate Tasks and Email Routing next because users most clearly benefit from
   live behavior there.
5. Add mutation cache updates for migrated pages.
6. Add focus/reconnect refetch globally through the query client.
7. Prepare and merge the shared-db PR required for Realtime, then add realtime
   invalidation for Tasks and Email Routing.
8. Migrate remaining pages.
9. Prepare and merge any shared-db aggregate/search views or RPCs, then replace
   dashboard/search global dependencies with lightweight queries.
10. Remove the global CRM bootstrap, move Fireflies health to its own hook, and
   demote the manual refresh action.

## Definition of Done

The site should feel like a Supabase-native CRM: fast to open, immediate after
edits, quietly self-updating, and resilient when one data surface has a problem.
Users should trust that what they are seeing is current without needing to press
"Refresh CRM data" as part of normal work.
