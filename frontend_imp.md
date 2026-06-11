# POP CRM Frontend Beautification Implementation Plan

## Purpose

This document is the complete implementation brief for redesigning the POP CRM frontend into a polished, production-quality application using **Tailwind Plus Application UI** and **Tremor**, while preserving the existing custom Directus-backed CRM logic.

It is written for a new developer with no prior context. If you are picking this up fresh, read this document first, then inspect the referenced files. The goal is to make the app beautiful, dense, credible, and operationally useful without replacing the working backend, data model, auth, migration, or custom CRM workflows.

## Executive Summary

The current CRM frontend works, but it is visually basic. It exposes many of the custom CRM functions that were migrated from Twenty into Directus, but it needs a professional application UI system: better shell/navigation, richer tables, better filters, better detail drawers, stronger hierarchy, polished empty/loading/error states, and analytics dashboards.

The user purchased **Tailwind Plus Application UI only**. Use it as the primary visual source for layouts and application patterns. Use **Tremor** for charts, KPI cards, trends, and data-rich dashboards. Keep the app as a custom Vite/React frontend.

Do **not** migrate the app to a new framework. Do **not** replace Directus SDK. Do **not** use the Directus Simple CRM template. Do **not** use ClickUp sync.

## Current Project

Repository:

- GitHub: `https://github.com/u2giants/popcrm-web`
- Local path: `/worksp/popcrm-web`
- Live production URL: `https://crm.designflow.app`
- Preview/dev alias: `https://crm-dev.designflow.app`
- Backend API: `https://data.designflow.app`
- Fireflies webhook/health: `https://crm-fireflies.designflow.app/health`

Current stack:

- Vite
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style components built on Radix primitives
- Directus SDK
- Lucide icons
- Sonner toasts

Current important files:

- `src/App.tsx`: auth gate and app shell wrapper.
- `src/auth/auth.tsx`: Directus auth state.
- `src/components/AppShell.tsx`: current minimal authenticated shell.
- `src/components/ui/*`: existing shadcn-style primitives.
- `src/features/crm/CrmPage.tsx`: current monolithic CRM workbench.
- `src/features/crm/api.ts`: Directus SDK reads/writes.
- `src/lib/types.ts`: Directus collection types used by the frontend.
- `src/lib/directus.ts`: Directus client config.
- `src/pages/LoginPage.tsx`: login screen.

Current deployed app state:

- The app serves `POP CRM`.
- `crm.designflow.app` points to `popcrm-web`, not POPPIM.
- Login branding was fixed from `POP PIM` to `POP CRM`.
- The app currently loads full CRM lists for core records.

## Current Backend and Data Context

The CRM is not based on Directus's Marketplace Simple CRM template. It is custom.

Backend repo:

- GitHub: `https://github.com/u2giants/directus`
- Local path: `/worksp/directus`

Relevant backend files:

- `/worksp/directus/pm-system/crm-schema.mjs`: custom Directus CRM collections/fields/relations.
- `/worksp/directus/pm-system/migration/twenty-import.mjs`: migration from Twenty into Directus.
- `/worksp/directus/pm-system/crm-worker.mjs`: Outlook ingest, rerouting, Fireflies webhook, contact sync, opportunity summaries.
- `/worksp/directus/pm-system/systemd/*`: systemd timers/services for worker tasks.

Important backend facts:

- ClickUp sync is intentionally omitted.
- Outlook ingest runs every 15 minutes.
- Reroute runs every 6 hours.
- Contact sync runs daily.
- Opportunity summary refresh runs every 6 hours.
- Fireflies webhook is live and routes meeting notes into CRM.

Current Directus data model exposed to the frontend includes:

- `retailer`: companies/accounts.
- `buyer`: contacts.
- `crm_department`: retailer departments.
- `crm_opportunity`: pipeline/program opportunities.
- `crm_email_message`: Outlook-ingested emails with routing metadata.
- `crm_meeting_note`: Fireflies/imported meeting notes.
- `crm_ignore_rule`: routing ignore rules.
- `crm_ai_model_config`: AI model config for routing/summaries.
- `crm_note`: manual/general CRM notes.
- `crm_task`: CRM tasks.
- `crm_licensor_approval_thread`: approval tracking.

Counts at cutover/backfill time:

- Retailers imported from Twenty: 3,736 before contact sync.
- Buyers imported from Twenty: 8,609 before contact sync.
- Departments: 41.
- Meeting notes: 27.
- Email messages: 10,712.
- PIM projects preserved: 651.
- PIM products preserved: 16,534.

Additional post-parity worker actions already run:

- Contact sync created 8 retailers and 3 contacts from email history.
- Deterministic reroute evaluated 6,957 messages and improved 901.

## Product Goal

Build a beautiful, highly usable CRM frontend that feels like a serious internal operating system for POP's customer, sales, licensing, and product-development workflows.

The visual target is not a marketing site. It should feel like a premium SaaS operations tool:

- Dense but breathable.
- Fast to scan.
- Clear visual hierarchy.
- Professional forms/tables.
- Strong detail drawers.
- Polished dashboard metrics.
- Helpful activity views.
- No decorative fluff.
- No oversized marketing hero sections.
- No card-inside-card nesting.

The app should remain highly custom to POP's CRM:

- Outlook email routing is a first-class workflow.
- Fireflies meeting notes are first-class.
- Retailer/buyer/department relationships matter.
- Manual routing and ignore rules matter.
- AI model config matters.
- Licensor approvals matter.
- Tasks and notes matter.
- Opportunity/program pipeline matters.

## Design and Implementation Decision

Use **Tailwind Plus Application UI** for the application interface patterns:

- App shell.
- Sidebar navigation.
- Header/topbar.
- Tables.
- Stacked lists.
- Forms.
- Slide-over panels.
- Modals/dialogs.
- Description lists.
- Empty states.
- Settings pages.
- Badges and status layouts.

Use **Tremor** for analytics and reporting:

- KPI cards.
- Area/bar/line charts.
- Donut charts.
- Trend indicators.
- Dashboard sections.
- Worker/routing health analytics.

Use existing shadcn/Radix primitives for interactive behavior:

- Dialogs/sheets.
- Dropdowns.
- Avatars.
- Buttons.
- Inputs.
- Scroll areas.
- Toasts.

The project should remain:

- Vite, not Next.js.
- Directus SDK, not a different data layer.
- Custom CRM screens, not a generic CRUD admin.

## Licensing and Source Handling

The user purchased **Tailwind Plus Application UI only**. Tailwind Plus code is commercial licensed. Follow these rules:

- Only use Tailwind Plus assets/code if the developer has legitimate access through the user's purchase.
- Do not commit upstream Tailwind Plus package/source as a vendored template dump.
- Copy/adapt only the specific component patterns needed into this private application.
- Keep copied/adapted code integrated with project conventions.
- Do not publish Tailwind Plus source snippets into public documentation beyond what is necessary for this private repo.
- If uncertain, build equivalent components inspired by Tailwind Plus patterns rather than pasting whole examples verbatim.

Tremor is open-source/commercial-friendly depending on the exact package/version. Verify the current license before installing. Use normal npm package installation unless project constraints require copy-paste primitives.

## Current UX Problems to Fix

The current `CrmPage.tsx` is monolithic and functional but not polished:

- Top navigation is a wrap of buttons, not a mature app shell.
- Most views are simple grids/lists.
- No strong dashboard landing page.
- Tables are not dense or sortable.
- Search is global but basic.
- Filters are minimal.
- Pipeline cards are basic.
- Detail panels are limited.
- Routing workbench is useful but visually plain.
- Settings are exposed but not elegant.
- Loading/error/empty states are inconsistent.
- There is little separation between data orchestration and presentation.
- Full-list loading may become expensive as data grows.
- No charting or trend visualizations yet.

## UX Principles

Use these principles throughout:

- Prefer tables for operational data where users compare many records.
- Prefer slide-over detail panels for editing and reviewing a selected record.
- Prefer dashboards for summary/health views, not for every screen.
- Keep top-level navigation persistent and predictable.
- Use badges for status, not large colored blocks.
- Use compact controls with icons for common actions.
- Use progressive disclosure: list -> detail drawer -> edit controls.
- Keep each page focused on one workflow.
- Avoid giant cards and marketing-like sections.
- Avoid nested cards.
- Avoid one-note color palettes.
- Avoid large hero type inside app panels.
- Make every screen work on desktop and mobile, but optimize primarily for desktop operations.

## Target Information Architecture

Replace the current tab-button layout with a left sidebar and app shell.

Primary navigation:

1. Overview
2. Pipeline
3. Accounts
4. Contacts
5. Email Routing
6. Meetings
7. Notes
8. Tasks
9. Approvals
10. Settings

Secondary/global actions:

- Global search/command palette.
- Refresh data.
- User menu.
- Directus/backend status indicator.
- Fireflies status indicator.

Recommended URL structure:

The app currently does not use route-per-page UX. Add React Router routes to make screens deep-linkable:

- `/` -> Overview
- `/pipeline`
- `/accounts`
- `/contacts`
- `/email`
- `/meetings`
- `/notes`
- `/tasks`
- `/approvals`
- `/settings`

Use query params for selected records later if useful:

- `/email?message=<id>`
- `/accounts?retailer=<id>`
- `/pipeline?opportunity=<id>`

If routing is too large for phase 1, keep internal state but structure components as route-ready modules.

## Target Frontend Architecture

Refactor away from a monolithic `CrmPage.tsx`.

Recommended structure:

```txt
src/
  app/
    AppLayout.tsx
    navigation.ts
    routes.tsx
  components/
    ui/
      existing shadcn primitives
    app/
      AppSidebar.tsx
      AppHeader.tsx
      AppPage.tsx
      PageToolbar.tsx
      StatusBadge.tsx
      MetricCard.tsx
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
      SectionHeader.tsx
      DetailDrawer.tsx
      DataTable.tsx
      FilterBar.tsx
      CommandSearch.tsx
  features/
    crm/
      api.ts
      constants.ts
      format.ts
      hooks.ts
      types.ts
      components/
        CrmStatusBadge.tsx
        RelationLabel.tsx
        OpportunityDrawer.tsx
        EmailDrawer.tsx
        AccountDrawer.tsx
        ContactDrawer.tsx
        TaskDrawer.tsx
        NoteDrawer.tsx
      pages/
        OverviewPage.tsx
        PipelinePage.tsx
        AccountsPage.tsx
        ContactsPage.tsx
        EmailRoutingPage.tsx
        MeetingsPage.tsx
        NotesPage.tsx
        TasksPage.tsx
        ApprovalsPage.tsx
        SettingsPage.tsx
```

Do not create all abstractions before they are used. But the end state should look roughly like this.

## Data Architecture

Keep the Directus SDK layer in `src/features/crm/api.ts`, but split by domain if it grows:

- `api/opportunities.ts`
- `api/accounts.ts`
- `api/contacts.ts`
- `api/email.ts`
- `api/settings.ts`
- `api/tasks.ts`
- `api/notes.ts`

For phase 1, it is acceptable to keep one `api.ts` and create hooks around it.

Add hooks for data loading and mutations:

- `useCrmBootstrapData()`
- `useOpportunities()`
- `useRetailers()`
- `useBuyers()`
- `useEmailMessages()`
- `useRoutingStats()`
- `useWorkerHealth()`
- `useCrmMutation()`

Strong recommendation:

- Add `@tanstack/react-query` for query caching, loading states, invalidation, and mutation ergonomics.
- If not added, build a small local loading/error wrapper, but React Query will likely pay off quickly.

Potential install:

```bash
npm install @tanstack/react-query
```

If React Query is added:

- Wrap app in `QueryClientProvider`.
- Replace manual `load()` and many `useState` arrays with queries.
- Use optimistic updates only where safe, such as status/stage changes.

## Performance and Data Loading

Current app loads full lists for companies, contacts, emails, meetings. This is acceptable short-term but will not scale forever.

Implement the redesign so pagination/server filtering can be introduced without reworking every screen.

Data table patterns should support:

- Search text.
- Sort field.
- Sort direction.
- Page size.
- Current page.
- Faceted status filters.
- Optional server-side Directus filters.

Priority server-side filters:

- Email routing status.
- Email date range.
- Retailer customer status.
- Opportunity stage.
- Task status.
- Approval status.

Do not let the beautiful UI hide slow loading. Add skeletons and clear loading states for every page.

## Tailwind Plus Application UI Usage

Use Tailwind Plus Application UI as the source for:

- Sidebar shell with collapsible sections.
- Stacked layout with sticky header.
- Tables with filters and bulk actions.
- Slide-over panels.
- Settings forms.
- Description lists.
- Empty states.
- Stats sections.
- Page headings.
- Form layouts.

Implementation guidance:

- Convert Tailwind Plus JSX examples to the existing Vite React style.
- Replace Heroicons with Lucide icons where possible, since the app already uses Lucide.
- Replace Headless UI components with existing Radix/shadcn components where equivalents already exist.
- Keep `Button`, `Input`, `Textarea`, `Badge`, `Sheet`, `DropdownMenu`, `Avatar`, `ScrollArea`, `Separator` from `src/components/ui`.
- Add missing shadcn-style primitives as needed, but do not over-install everything at once.
- Preserve Tailwind Plus spacing/hierarchy. The subtle spacing is a big part of why it looks professional.

Likely needed new primitives:

- Tabs
- Dialog
- Select
- Combobox
- Table
- Pagination
- Tooltip
- Popover
- Command
- Calendar/date picker

Add these either manually or with the project's shadcn workflow. Check existing `components.json` first.

## Tremor Usage

Use Tremor for the Overview dashboard and analytics surfaces.

Potential install:

```bash
npm install @tremor/react
```

Verify compatibility with Tailwind CSS 4 and React 19 before committing. If Tremor has version incompatibility, use Tremor's design patterns and build equivalent chart cards with another chart library, but try Tremor first.

Use Tremor for:

- `MetricCard` style cards.
- Area charts for email volume over time.
- Bar charts for routing status counts.
- Donut charts for opportunity stage distribution.
- Trend cards for weekly/monthly movement.
- Dashboard panels for worker health.

Do not use Tremor for:

- Main app shell.
- CRUD tables.
- Detailed forms.
- Routing drawers.
- Complex record editing.

Dashboard metrics to build:

- Total accounts.
- Total contacts.
- Open opportunities.
- Unrouted email count.
- Routed email count.
- Skipped email count.
- Company-only routed count.
- Company+department routed count.
- Meetings imported.
- Tasks open.
- Approvals pending.
- Fireflies health.
- Outlook ingest last success if available from backend/systemd later.

Initial charts:

- Email routing status distribution.
- Opportunity stage distribution.
- Meetings imported by month/date if enough data.
- Task status distribution.
- Approval status distribution.

If the backend does not expose time-series aggregates yet, compute from loaded records for phase 1 and add Directus aggregate queries later.

## Visual Direction

Overall feel:

- Modern B2B SaaS.
- White/light by default.
- Subtle slate/gray borders.
- One or two calm accent colors.
- Dense operational UI.
- No loud gradients.
- No decorative blobs/orbs.

Recommended palette:

- Background: neutral white/off-white.
- Text: slate/zinc.
- Primary: restrained blue or indigo.
- Success: emerald.
- Warning: amber.
- Error: red.
- Neutral status: zinc/slate.

Avoid:

- Purple-heavy SaaS gradient look.
- Beige/tan/brown dominance.
- Oversized cards everywhere.
- Marketing hero layout.
- Card-inside-card.

Typography:

- Keep existing Geist font.
- Use small, tight headings in panels.
- Use `text-sm` and `text-xs` generously for dense CRM data.
- Avoid viewport-based font sizes.
- Letter spacing should remain normal.

Spacing:

- Use Tailwind Plus spacing patterns.
- Prefer consistent page padding: `px-4 sm:px-6 lg:px-8`.
- Use compact row heights for tables.
- Use fixed dimensions for icon buttons.

## Page-by-Page Implementation Plan

### 1. App Shell

Replace the current minimal `AppShell` with a polished Tailwind Plus-inspired shell.

Requirements:

- Left sidebar on desktop.
- Mobile drawer sidebar.
- Sticky top header.
- App name: `POP CRM`.
- Environment/status chip: `Directus`.
- User menu.
- Navigation items with icons.
- Active route styling.
- Global search input or command button.
- Refresh action.
- Fireflies health indicator.

Files:

- Replace/expand `src/components/AppShell.tsx`.
- Add `src/app/navigation.ts`.
- Add `src/components/app/AppSidebar.tsx`.
- Add `src/components/app/AppHeader.tsx`.

Acceptance criteria:

- Sidebar looks polished and professional.
- Mobile navigation is usable.
- Active page is obvious.
- Header does not wrap awkwardly.
- No text overlap on narrow widths.

### 2. Routing and Page Modules

Add route-based pages using `react-router-dom`.

Current dependency already includes `react-router-dom`.

Implementation:

- Add `BrowserRouter` in `src/main.tsx` or `src/App.tsx`.
- Define routes.
- Move page-specific JSX out of `CrmPage.tsx`.
- Keep `CrmPage.tsx` temporarily as a composition wrapper if needed.

Acceptance criteria:

- `/`, `/pipeline`, `/accounts`, `/contacts`, `/email`, `/meetings`, `/notes`, `/tasks`, `/approvals`, `/settings` work.
- Navigation updates URL.
- Refresh retains current page.

### 3. Shared App Components

Build reusable application components before page polish.

Components:

- `AppPage`: standard page wrapper with title, description, actions, children.
- `PageToolbar`: search/filter/action row.
- `MetricCard`: Tremor or Tremor-inspired metric.
- `StatusBadge`: generic status badge.
- `CrmStatusBadge`: CRM-specific status mapping.
- `DataTable`: table shell with header, rows, empty state, loading state, optional pagination.
- `DetailDrawer`: standard `Sheet` wrapper with title/description/action footer.
- `EmptyState`: Tailwind Plus-inspired empty state.
- `LoadingState`: skeleton state.
- `ErrorState`: retry state.

Acceptance criteria:

- Pages use shared components consistently.
- No repeated ad hoc table/list markup across pages.
- Status badges look consistent everywhere.

### 4. Overview Dashboard

Create a beautiful CRM landing page.

Route:

- `/`

Content:

- Top KPI strip:
  - Accounts.
  - Contacts.
  - Open opportunities.
  - Emails needing routing.
  - Meetings.
  - Open tasks.
  - Pending approvals.
- Routing health panel:
  - Donut/bar chart of `crm_email_message.routing_status`.
  - Fireflies health.
  - Worker cadence labels.
- Pipeline distribution:
  - Opportunity stage chart.
- Activity panels:
  - Recent unrouted emails.
  - Recent meetings.
  - Upcoming/open tasks.
  - Pending approvals.

Use Tremor for:

- Metric cards.
- Charts.

Acceptance criteria:

- The first screen looks like a premium SaaS CRM dashboard.
- It gives a real operational snapshot, not decorative filler.
- Each panel links or navigates to the relevant page.

### 5. Pipeline Page

Current pipeline is a basic horizontal grid. Redesign it.

Route:

- `/pipeline`

Requirements:

- Stage columns with sticky headers.
- Compact opportunity cards.
- Clear stage counts.
- Stage selector or drag-and-drop later.
- Detail drawer on opportunity click.
- Filters by retailer, division, program type, season/year, stage.
- Search by opportunity name, PO, SO, retailer.

Opportunity card should show:

- Name.
- Retailer.
- Department.
- Stage badge.
- PO/SO if present.
- Close/hard delivery date if present.
- AI summary indicator if present.

Opportunity drawer should show:

- Header with name, retailer, stage.
- Key fields as description list.
- AI summary editable area.
- Related email count if available.
- Related meetings/notes/tasks if available.
- Stage update control.

Acceptance criteria:

- Pipeline is much more polished than current cards.
- Cards are compact and readable.
- Drawer supports editing summary and stage.

### 6. Accounts Page

Route:

- `/accounts`

Data:

- `retailer`

Requirements:

- Tailwind Plus-style table.
- Search by name/domain/status/aliases.
- Filters by `customer_status`, `chain_type`.
- Columns:
  - Name.
  - Domain.
  - Customer status.
  - Chain type.
  - Routing aliases.
  - Related contact count if easy to compute.
  - Related opportunity count if easy to compute.
- Detail drawer with:
  - Account basics.
  - Routing aliases.
  - Contacts for account.
  - Departments for account if available.
  - Opportunities for account.
  - Recent emails for account.

Acceptance criteria:

- Accounts page feels like a real CRM account list.
- Drawer provides relationship context.

### 7. Contacts Page

Route:

- `/contacts`

Data:

- `buyer`

Requirements:

- Table with search and filters.
- Columns:
  - Name.
  - Email.
  - Retailer.
  - Department.
  - Job title.
  - Contact type.
  - Scope.
- Filters:
  - Retailer.
  - Contact type.
  - Scope.
- Detail drawer:
  - Contact details.
  - Account/department.
  - Related emails/meetings if available.

Acceptance criteria:

- Contacts are easier to scan than current cards.
- Long emails/names truncate gracefully.

### 8. Email Routing Page

This is one of the most important custom workflows.

Route:

- `/email`

Data:

- `crm_email_message`
- `crm_ignore_rule`
- `retailer`
- `crm_department`
- `crm_opportunity`

Requirements:

- Default view should prioritize messages needing routing.
- Tabs or segmented filter:
  - Needs routing.
  - Routed.
  - Skipped.
  - All.
- Status filter.
- Date filter.
- Search by subject, sender, recipient, retailer.
- Dense table with:
  - Date.
  - Subject.
  - Sender.
  - Routing status.
  - Routing method.
  - Retailer.
  - Department.
  - Opportunity.
- Detail drawer for manual routing:
  - Subject.
  - Sender/recipients.
  - Body preview.
  - Status select.
  - Retailer select/combobox.
  - Department select/combobox.
  - Opportunity select/combobox.
  - Routing method.
  - Save button.
  - Create ignore rule from subject.
- Side panel or secondary section:
  - Ignore rules list.
  - Create ignore rule.
  - Worker cadence.
  - Fireflies status.

Important UX:

- Use combobox/autocomplete for retailer/opportunity once practical. Native select with thousands of accounts is not acceptable long-term.
- Make status visually obvious.
- Keep manual routing fast. The user should not fight the UI.

Acceptance criteria:

- Manual routing is clearly better than current implementation.
- Needs-routing queue is obvious and actionable.
- Ignore rules are visible and manageable.

### 9. Meetings Page

Route:

- `/meetings`

Data:

- `crm_meeting_note`

Requirements:

- Table or stacked list.
- Search by title, participants, summary, retailer.
- Filters by source, retailer, date.
- Columns:
  - Date.
  - Meeting name.
  - Participants.
  - Retailer.
  - Contact.
  - Source.
- Detail drawer:
  - Summary.
  - Action items.
  - Participants.
  - Retailer/contact/opportunity links.
  - Fireflies transcript id/source metadata.

Acceptance criteria:

- Fireflies meeting notes feel first-class.
- Summaries/action items are easy to read.

### 10. Notes Page

Route:

- `/notes`

Data:

- `crm_note`

Requirements:

- Polished list/table.
- New note slide-over or inline panel.
- Search by title/body/action items.
- Filters by source, retailer, opportunity.
- Detail drawer for reading/editing later.

Current frontend can create notes, but only minimally. Improve:

- Better form layout.
- Optional relation pickers for retailer/contact/opportunity/department if API supports create payload.
- Clear empty state.

Acceptance criteria:

- Creating a note feels intentional and polished.

### 11. Tasks Page

Route:

- `/tasks`

Data:

- `crm_task`

Requirements:

- Task board or table.
- Filters by status, assignee, due date.
- Columns/cards:
  - Title.
  - Status.
  - Due date.
  - Retailer.
  - Opportunity.
  - Assignee.
- Status update control.
- Detail drawer for task body and relations.

Acceptance criteria:

- Open work is obvious.
- Changing task status is fast.

### 12. Approvals Page

Route:

- `/approvals`

Data:

- `crm_licensor_approval_thread`

Requirements:

- Table/list focused on pending approvals.
- Filters by status, licensor, opportunity.
- Columns:
  - Name.
  - Licensor.
  - Approval status.
  - Submitted at.
  - Approved at.
  - Opportunity.
  - Latest comment.
- Detail drawer:
  - Approval metadata.
  - Comment.
  - Related opportunity.

Acceptance criteria:

- Pending licensor approvals are obvious.
- The screen looks like a real approval tracker, not leftover CRUD.

### 13. Settings Page

Route:

- `/settings`

Sections:

- AI model config.
- Ignore rules.
- Worker/system status.
- Integration endpoints.

AI model config:

- `email_routing_model`
- `fireflies_routing_model`
- `transcript_split_model`
- `opportunity_summary_model`

Worker status:

- Outlook ingest cadence.
- Reroute cadence.
- Contact sync cadence.
- Summary cadence.
- Fireflies health.

Do not expose secrets in the browser.

Acceptance criteria:

- Settings look like a modern SaaS settings page.
- AI model config is editable but not confusing.
- System health is visible without leaking secrets.

### 14. Login Page

Current login is functional and now branded `POP CRM`.

Make it beautiful but restrained:

- Tailwind Plus sign-in pattern.
- POP CRM name.
- Microsoft login primary or prominent.
- Email/password fallback.
- Error state.
- Loading state.

Avoid:

- Marketing hero.
- Large illustration.
- POPPIM references.

Acceptance criteria:

- Login no longer looks like a scaffold.
- It clearly belongs to POP CRM.

## Interaction Patterns

### Detail Drawers

Use slide-over drawers for record detail.

Standard drawer structure:

- Header:
  - Record title.
  - Subtitle/relationship.
  - Status badge.
- Body:
  - Description list.
  - Related records.
  - Editable fields.
- Footer:
  - Save/cancel where editing.
  - Secondary actions.

Use one drawer per domain:

- `EmailDrawer`
- `OpportunityDrawer`
- `AccountDrawer`
- `ContactDrawer`
- `TaskDrawer`
- `NoteDrawer`

### Tables

Tables should support:

- Sticky-ish header if possible.
- Compact rows.
- Hover state.
- Row click opens drawer.
- Sortable headers where simple.
- Empty state.
- Loading skeleton.
- Mobile fallback: stacked rows/cards.

Use Tailwind Plus table examples as visual basis.

### Filters

Use:

- Search input.
- Select/combobox filters.
- Segmented controls for high-level statuses.
- Clear filters button.

Avoid:

- Dumping too many controls into one row on mobile.
- Native select with thousands of options for long-term relation selection.

### Command Search

Optional but high-value:

- Global command/search.
- Search across accounts, contacts, opportunities, emails.
- Jump to pages.

Implement after core pages if time permits.

## Component Library Strategy

Keep existing shadcn-style components and add missing components as needed.

Existing components:

- `avatar`
- `badge`
- `button`
- `card`
- `checkbox`
- `dropdown-menu`
- `input`
- `scroll-area`
- `separator`
- `sheet`
- `skeleton`
- `sonner`
- `textarea`

Likely add:

- `dialog`
- `tabs`
- `select`
- `popover`
- `command`
- `tooltip`
- `table`
- `pagination`
- `calendar`

When adding components:

- Match existing style.
- Keep components in `src/components/ui`.
- Use Radix primitives where appropriate.
- Use Lucide icons.

## API Enhancements Needed

The current `api.ts` can fetch and update key collections, but the redesigned UI will need more targeted functions.

Add:

- `fetchRoutingStats()`
- `fetchOpportunityStageStats()`
- `fetchTaskStats()`
- `fetchApprovalStats()`
- `fetchRecentActivity()`
- `fetchDepartments()`
- `updateRetailer()`
- `updateBuyer()`
- `updateNote()`
- `updateApprovalThread()` if needed.
- `createTask()` if task creation is needed.
- `createApprovalThread()` only if business process requires it.

Potential Directus aggregate usage:

- Use Directus aggregate queries for counts when possible rather than always loading full lists.
- For phase 1, local aggregation is acceptable because current data sizes are manageable.

## Type Enhancements Needed

Current `src/lib/types.ts` has core CRM interfaces.

Add or refine:

- `CrmRelation`
- status union types for routing/task/approval/stage.
- helper types for drawer form state.
- `CrmDashboardStats`.
- `CrmHealthStatus`.

Keep types practical. Do not over-model every Directus field if not used.

## Accessibility Requirements

Minimum requirements:

- Keyboard accessible navigation.
- Visible focus states.
- Proper button labels.
- Icon-only buttons must have `title` or accessible labels.
- Drawers/dialogs use Radix/shadcn focus management.
- Tables have semantic markup.
- Color is not the only status indicator; text badges are used.
- Form controls have labels.

## Responsive Requirements

Desktop:

- Primary target.
- Sidebar visible.
- Dense tables.
- Drawers up to `sm:max-w-2xl` or larger where needed.

Tablet:

- Sidebar may collapse.
- Tables can scroll horizontally.
- Filters wrap cleanly.

Mobile:

- Sidebar drawer.
- Tables should degrade to stacked rows/cards where necessary.
- Text must not overflow buttons/cards.
- No overlapping UI.

## Testing and Verification

Run before every commit:

```bash
npm run build
npm run lint
```

Current known lint warnings:

- `src/auth/auth.tsx` has pre-existing warnings about `any`, setState in effect, and unused eslint disable.
- Do not add new warnings in redesigned files.

Recommended additional checks:

- Manual smoke test logged out: login page says `POP CRM`.
- Manual smoke test logged in: all pages render.
- Verify `https://crm.designflow.app` after deployment.
- Verify Fireflies health indicator calls `https://crm-fireflies.designflow.app/health`.
- Check browser console for runtime errors.
- Check mobile viewport.
- Check 1440px desktop viewport.

If adding Playwright later:

- Test app shell loads.
- Test login page branding.
- Test each route renders.
- Test email drawer opens.
- Test opportunity drawer opens.
- Test settings AI model controls render.

## Deployment Process

Current manual deployment:

```bash
cd /worksp/popcrm-web
npm run build
docker build -t popcrm-web:latest .
docker rm -f popcrm-web
docker run -d --name popcrm-web --network coolify \
  --label traefik.enable=true \
  --label 'traefik.http.routers.popcrm-web-http.rule=Host(`crm-dev.designflow.app`) || Host(`crm.designflow.app`)' \
  --label traefik.http.routers.popcrm-web-http.entrypoints=http \
  --label traefik.http.routers.popcrm-web-http.middlewares=redirect-to-https@docker \
  --label 'traefik.http.routers.popcrm-web-https.rule=Host(`crm-dev.designflow.app`) || Host(`crm.designflow.app`)' \
  --label traefik.http.routers.popcrm-web-https.entrypoints=https \
  --label traefik.http.routers.popcrm-web-https.tls=true \
  --label traefik.http.routers.popcrm-web-https.tls.certresolver=letsencrypt \
  --label traefik.http.services.popcrm-web.loadbalancer.server.port=80 \
  popcrm-web:latest
```

Verify:

```bash
curl -fsS https://crm.designflow.app | rg -o '<title>[^<]+'
curl -fsS https://crm-fireflies.designflow.app/health
```

Future improvement:

- Add GitHub Actions build/push/deploy or Coolify-managed app deployment.

## Phased Roadmap

### Phase 0: Setup and Baseline

Tasks:

- Confirm access to Tailwind Plus Application UI.
- Install Tremor if compatible.
- Add missing shadcn primitives needed for shell/drawers/tables.
- Create `src/components/app`.
- Create route/page structure.
- Keep current app functional during refactor.

Deliverables:

- App still builds.
- Existing CRM pages still reachable.
- New shell skeleton in place.

### Phase 1: App Shell and Navigation

Tasks:

- Implement Tailwind Plus-inspired app shell.
- Add sidebar navigation.
- Add route-based pages.
- Add header with global search placeholder, refresh, status, user menu.
- Improve login screen.

Deliverables:

- The app immediately feels more polished.
- All current tabs become sidebar pages.

### Phase 2: Shared UI System

Tasks:

- Build `AppPage`, `PageToolbar`, `DataTable`, `DetailDrawer`, `MetricCard`, `EmptyState`, `LoadingState`, `CrmStatusBadge`.
- Replace repeated ad hoc layout with these components.

Deliverables:

- Consistent UI patterns.
- Easier page-by-page redesign.

### Phase 3: Overview Dashboard with Tremor

Tasks:

- Add dashboard metrics.
- Add routing distribution chart.
- Add opportunity stage chart.
- Add recent work panels.

Deliverables:

- Beautiful landing dashboard.
- Tremor integrated successfully.

### Phase 4: Email Routing Redesign

Tasks:

- Build dense routing table.
- Build manual routing drawer.
- Build ignore rules panel.
- Add filters/search/status segments.
- Add relation pickers.

Deliverables:

- Best-in-class custom email routing workflow.

### Phase 5: Pipeline Redesign

Tasks:

- Redesign pipeline board.
- Add opportunity detail drawer.
- Improve stage movement/update UX.
- Add filters/search.

Deliverables:

- Polished CRM pipeline.

### Phase 6: Accounts and Contacts

Tasks:

- Build accounts table/drawer.
- Build contacts table/drawer.
- Add relationship summaries.

Deliverables:

- CRM account/contact management feels professional.

### Phase 7: Meetings, Notes, Tasks, Approvals

Tasks:

- Redesign meeting notes.
- Redesign note creation.
- Redesign task management.
- Redesign approvals tracker.

Deliverables:

- All custom CRM capabilities have polished screens.

### Phase 8: Settings and System Health

Tasks:

- Redesign AI model settings.
- Add worker cadence/status cards.
- Add ignore rule management.
- Add integration status.

Deliverables:

- Settings feel like a real admin surface.

### Phase 9: Performance and Polish

Tasks:

- Add server-side filtering/pagination where needed.
- Add skeletons to every page.
- Add empty/error states.
- Audit mobile layouts.
- Audit accessibility.
- Remove dead Vite assets if unused.
- Clean docs references still copied from PIM.

Deliverables:

- Production-ready polished CRM.

## Detailed Developer Checklist

Use this checklist while implementing.

### Preparation

- [ ] Pull latest `main`.
- [ ] Run `npm install`.
- [ ] Run `npm run build`.
- [ ] Run `npm run lint`.
- [ ] Confirm login page says `POP CRM`.
- [ ] Confirm `src/features/crm/CrmPage.tsx` current behavior before refactor.
- [ ] Review Tailwind Plus Application UI examples for shell, tables, slide-overs, settings, stats.
- [ ] Review Tremor docs/examples for metric cards and charts.

### Shell

- [ ] Create app navigation config.
- [ ] Create sidebar.
- [ ] Create mobile sidebar.
- [ ] Create header.
- [ ] Add active navigation state.
- [ ] Add user menu.
- [ ] Add Fireflies status chip.
- [ ] Add refresh action.

### Routing

- [ ] Add React Router routes.
- [ ] Move current views into page components.
- [ ] Ensure all routes render.

### Data

- [ ] Decide whether to add React Query.
- [ ] If yes, add provider and query hooks.
- [ ] Split API only if it makes the code clearer.
- [ ] Add dashboard stat helpers.
- [ ] Add relation helper utilities.

### Components

- [ ] Add `AppPage`.
- [ ] Add `PageToolbar`.
- [ ] Add `DataTable`.
- [ ] Add `DetailDrawer`.
- [ ] Add `MetricCard`.
- [ ] Add `EmptyState`.
- [ ] Add `LoadingState`.
- [ ] Add `CrmStatusBadge`.
- [ ] Add relation labels/links.

### Pages

- [ ] Overview dashboard.
- [ ] Pipeline.
- [ ] Accounts.
- [ ] Contacts.
- [ ] Email Routing.
- [ ] Meetings.
- [ ] Notes.
- [ ] Tasks.
- [ ] Approvals.
- [ ] Settings.

### Final Polish

- [ ] Run build.
- [ ] Run lint.
- [ ] Test desktop.
- [ ] Test mobile.
- [ ] Test logged out.
- [ ] Test logged in.
- [ ] Test drawers.
- [ ] Test status updates.
- [ ] Test note creation.
- [ ] Test ignore rule creation.
- [ ] Test AI config editing.
- [ ] Deploy.
- [ ] Verify live URL.
- [ ] Commit and push.

## Risks and Mitigations

### Risk: Template transplant creates too much churn

Mitigation:

- Do not transplant a whole template.
- Copy/adapt specific Tailwind Plus patterns into existing architecture.
- Keep the app working after each phase.

### Risk: Native selects are unusable for thousands of accounts

Mitigation:

- Add combobox/autocomplete for retailer/contact/opportunity relation fields.
- Consider server-side Directus search for relation pickers.

### Risk: Full-list loading gets slow

Mitigation:

- Implement table APIs that support server-side pagination/filtering.
- Start with local aggregation for dashboard, then move heavy stats to Directus aggregate queries.

### Risk: Tremor conflicts with Tailwind 4 or project styling

Mitigation:

- Test Tremor in a small branch/page first.
- If incompatible, use Tremor visual patterns and implement charts/cards with a compatible chart library.

### Risk: Paid Tailwind Plus code mishandled

Mitigation:

- Keep usage private.
- Do not vendor entire template directories.
- Adapt only necessary components.

### Risk: Visual polish compromises custom workflows

Mitigation:

- Email routing and opportunity detail are custom workflows and must drive UX decisions.
- Do not force generic dashboard layouts where an operational table/drawer is better.

## What Not To Do

- Do not migrate to Next.js.
- Do not replace Directus SDK.
- Do not install/use Directus Simple CRM template.
- Do not reintroduce ClickUp sync.
- Do not replace the backend schema.
- Do not rebuild Twenty.
- Do not make a marketing landing page.
- Do not hide custom workflows behind generic CRUD pages.
- Do not create decorative gradients/orbs.
- Do not use huge hero sections.
- Do not create card-inside-card layouts.
- Do not expose secrets or environment values in the UI.

## Definition of Done

The redesign is done when:

- The app looks like a premium production CRM, not a scaffold.
- Every existing CRM capability remains accessible.
- Email routing is faster and clearer than before.
- Pipeline is polished and usable.
- Accounts/contacts are table-driven and searchable.
- Meetings, notes, tasks, approvals, and settings have first-class screens.
- Tremor dashboard gives useful operational insight.
- Tailwind Plus patterns are visible in shell, tables, drawers, forms, settings, and empty states.
- Build passes.
- Lint has no new warnings beyond known pre-existing auth warnings, or those auth warnings are fixed.
- Live deployment works at `https://crm.designflow.app`.

## Current Git Context at Time of Writing

Recent frontend commits:

- `28847c6 fix CRM login branding`
- `ca87571 load complete CRM lists`
- `839e19f expose full CRM workflows in UI`

Recent backend CRM commits:

- `ff7dd9b close CRM parity worker gaps`
- `8f24c0e document CRM cutover`
- `6a05761 add CRM Fireflies webhook worker`
- `4a237ca add CRM Directus migration`

Use these as starting points if investigating why something exists.

## Suggested First Pull Request

For the first actual implementation PR, keep scope tight:

1. Add Tailwind Plus-inspired app shell.
2. Add route-based page skeletons.
3. Move existing CRM sections into those pages with minimal behavior changes.
4. Add shared `AppPage`, `PageToolbar`, `EmptyState`, `LoadingState`, and `CrmStatusBadge`.
5. Do not redesign every page yet.

This gives the whole app a better frame while keeping risk low.

## Suggested Second Pull Request

Build the Overview dashboard:

1. Install and validate Tremor.
2. Add dashboard stat helpers.
3. Add KPI cards.
4. Add routing status chart.
5. Add opportunity stage chart.
6. Add recent emails/tasks/meetings panels.

This will create the first high-impact beautiful screen.

## Suggested Third Pull Request

Redesign Email Routing:

1. Dense table.
2. Filters.
3. Manual routing drawer.
4. Ignore rules panel.
5. Better relation selectors.

This is the highest-value custom workflow.

## Final Note

The CRM's advantage is not that it is generic. Its advantage is that it encodes POP's real operational workflows from Twenty, Outlook, Fireflies, licensor approvals, and Directus. Tailwind Plus and Tremor should make that custom system beautiful and clear. They should not erase the custom shape of the product.
