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
   refetches or patches the changed row.
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
- The implementation should preserve the existing security model: browser-safe
  reads through `api` views, RLS-enforced writes through `crm` tables or guarded
  RPCs.

## Implementation Phases

### Phase 1: Remove the Global Loading Bottleneck

Replace the all-CRM bootstrap with page-scoped data loading.

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
- Keep previous data visible while refreshing.
- Move global stats to their own lightweight queries instead of deriving all
  counts from globally loaded arrays.
- Keep `CrmDataContext` temporarily as a compatibility wrapper during migration,
  then delete it once pages no longer depend on global arrays.

Expected result:

- The app shell renders immediately.
- Navigating to one page does not require loading every CRM collection.
- "Loading..." becomes local and brief, not a whole-app state.

### Phase 2: Make Writes Feel Instant

Update local cached data immediately after successful user actions, and use
optimistic updates for simple edits.

- For inline table edits, update the row in the page cache immediately.
- For drawer edits, update both the selected record and the list row cache.
- For create actions, insert the new adapted row into the relevant cache after
  Supabase returns the created record.
- For drag/status changes, apply an optimistic patch before awaiting the write.
- On write failure, revert the optimistic patch and show a clear toast.
- Invalidate related queries after writes so views and derived fields reconcile
  with Supabase.

Expected result:

- A user action appears to complete immediately.
- Manual refresh is not needed after editing a task, routing an email, or
  changing an account/contact field.

### Phase 3: Add Background Freshness

Make the app quietly refresh at natural moments.

- Refetch active page queries when the browser window regains focus.
- Refetch active page queries after reconnecting from offline/network loss.
- Add conservative background intervals for high-change pages:
  - Email Routing: frequent enough to catch new queue items quickly.
  - Tasks: moderate interval.
  - Meetings and notes: moderate interval.
  - Accounts/contacts/opportunities: slower interval or focus-only.
- Avoid replacing visible data with loading placeholders during background
  refetches.
- Add a small non-blocking "updated" or "syncing" affordance only if users need
  feedback.

Expected result:

- Users who leave a tab open see current data when they return.
- Webhook- and worker-created records appear without a manual refresh.

### Phase 4: Add Supabase Realtime for High-Value Tables

Use Supabase Realtime to trigger targeted refetches or patches.

Start with tables that change often or where freshness is operationally
important:

- `crm.email_message`
- `crm.task`
- `crm.meeting_note`
- `crm.note`
- `crm.opportunity`
- `crm.department`
- account/contact source tables in the shared core schema, if exposed to
  Realtime and allowed by policy

Implementation approach:

- Create a small realtime subscription module, for example
  `src/features/crm/realtime.ts`.
- Subscribe only while the relevant page or app section is mounted.
- On insert/update/delete events, invalidate the matching page query.
- Debounce bursts of events to avoid refetch storms.
- Prefer refetching the relevant `api.crm_*` view for correctness, because the
  event payload may not contain joined display fields.
- Keep polling/focus refresh as a fallback even after Realtime is added.

Expected result:

- Other users' changes and automation output show up naturally.
- The app feels live without trying to mirror the entire database in memory.

### Phase 5: Make Dashboard and Search Lightweight

The dashboard and command search should not require loading every operational
record.

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

## Risks and Constraints

- Supabase Realtime must be enabled for the relevant tables.
- Realtime authorization and RLS behavior must be verified for each schema/table.
- Events from base tables may not include joined fields from the `api` views.
- High-volume tables can create noisy realtime traffic if subscriptions are too
  broad.
- Some existing pages assume all CRM arrays are globally available; migration
  should be incremental to avoid a large risky rewrite.
- Documentation still contains Directus-era language and should be updated as a
  separate cleanup so future contributors do not make the wrong architectural
  assumptions.

## Acceptance Criteria

- Initial signed-in shell renders without waiting for all CRM collections.
- Opening a page fetches only that page's required data.
- Navigating back to a previously visited page shows cached data immediately.
- Editing a row or drawer updates the visible UI without clicking refresh.
- New email-routing items and task updates appear through background refresh or
  realtime.
- Manual refresh is no longer needed during normal CRM operation.
- No page returns to the old all-or-nothing global loading behavior.
- Existing RLS and browser-safe view boundaries remain intact.

## Proposed Rollout Order

1. Add the query/cache foundation and migrate one low-risk page.
2. Migrate Tasks and Email Routing next because users most clearly benefit from
   live behavior there.
3. Add mutation cache updates for migrated pages.
4. Add focus/reconnect refetch globally through the query client.
5. Add realtime invalidation for Tasks and Email Routing.
6. Migrate remaining pages.
7. Replace dashboard/search global dependencies with lightweight queries.
8. Remove the global CRM bootstrap and demote the manual refresh action.

## Definition of Done

The site should feel like a Supabase-native CRM: fast to open, immediate after
edits, quietly self-updating, and resilient when one data surface has a problem.
Users should trust that what they are seeing is current without needing to press
"Refresh CRM data" as part of normal work.
