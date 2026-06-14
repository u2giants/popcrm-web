# Architecture — popcrm-web

`popcrm-web` is a static React SPA for POP CRM.

```txt
Browser
  -> https://crm.designflow.app
  -> popcrm-web nginx container
  -> React/Vite SPA
  -> Directus SDK
  -> https://data.designflow.app
  -> Directus/Postgres shared backend
```

Fireflies integration is handled by a separate worker endpoint:

```txt
Fireflies
  -> https://crm-fireflies.designflow.app/s/fireflies-webhook
  -> popcrm-fireflies container
  -> Directus CRM collections
```

The frontend has no database and stores no CRM data locally. It uses browser session authentication against Directus.

## Data loading

`CrmDataContext.tsx` loads all CRM collections once on mount via `Promise.allSettled`.
Each collection loads independently — a single 403 leaves that section empty without
blanking the whole app. Pages subscribe to the shared context; no page fetches on its own.

Write operations (`api.ts`) call Directus directly and optimistically update the relevant
context setter (`setNotes`, `setIgnoreRules`, etc.) so the UI reflects changes without a
full refresh.

## Key modules

| Module | Purpose |
|---|---|
| `src/auth/auth.tsx` | Directus session/user state |
| `src/lib/directus.ts` | Directus SDK client |
| `src/lib/types.ts` | Frontend schema types (mirrors Directus collections) |
| `src/features/crm/api.ts` | All Directus reads and writes |
| `src/features/crm/constants.ts` | Enums, stage lists, tone/status helpers |
| `src/features/crm/format.ts` | Display formatters: `label()`, `formatDate()`, `relatedName()`, etc. |
| `src/features/crm/CrmDataContext.tsx` | Bootstrap loader; shared state for all pages |
| `src/features/crm/useRecordSelection.ts` | URL-param-backed record selection (deep links) |
| `src/app/AppLayout.tsx` + `src/app/routes.tsx` | App shell and route-per-page |

## Page components (`src/features/crm/pages/`)

| Page | Route | Notes |
|---|---|---|
| `OverviewPage` | `/` | KPI strip, email volume chart, routing donut, pipeline bar, activity panels |
| `PipelinePage` | `/pipeline` | Board (kanban by stage) + List (DataTable) toggle |
| `AccountsPage` | `/accounts` | DataTable + AccountDrawer. Segmented tabs: **Accounts** (default — hides "Not a Customer"), **Triage** (New Companies awaiting review), **Not a customer**, **All**. Status & Chain cells are inline-editable colored chips |
| `DepartmentsPage` | `/departments` | DataTable over CRM departments |
| `ProgramsPage` | `/programs` | DataTable over CRM opportunities/programs + OpportunityModal |
| `ContactsPage` | `/contacts` | DataTable + ContactDrawer. Segmented tabs: **Cust Contacts** (linked to Active/Potential account), **Dept. Contacts**, **Triage**, **All** |
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
| `DataTable` | Sortable table with column visibility, resize (visible separator), reorder. Per-column tools in the header: a persistent filter icon → checkbox **value popover** (set filter), and a quick-**search box with value autocomplete**. Optional inline editing: columns with `editOptions` render click-to-edit dropdowns and a spreadsheet **drag-to-copy** fill handle; edits persist via the `onCellEdit` prop. Columns with `opensDetail` are the only detail-drawer triggers once any column opts in. Popovers/autocomplete use fixed positioning to escape `overflow:hidden` |
| `AccountLogo` | Brand logo from logo.dev keyed on `retailer.domain` (token `VITE_LOGODEV_TOKEN`), falling back to `NameAvatar` initials when no domain/token or on image error |
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
| `AccountDrawer` | Logo avatar (`AccountLogo`) in header, colored status/chain chips, contact list, opportunity list, close button footer |
| `ContactDrawer` | Related account, opportunity list |
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
