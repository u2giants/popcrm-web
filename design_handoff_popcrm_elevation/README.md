# Handoff: POP CRM — Fortune-500 Visual Elevation

## Overview

This package is the design brief for elevating **popcrm-web** from a functional-but-utilitarian
internal tool into something that reads like a flagship enterprise SaaS product —
**dense, confident, information-rich, and visually polished**, without wasting space on the
oversized padding and empty hero zones that plague most "clean" CRM redesigns.

The redesign is **a re-skin and re-compose, not a rewrite**. Every existing route, Directus
collection, custom workflow (Outlook routing, Fireflies meetings, licensor approvals), and the
existing OKLCH token system are preserved. We are changing **density, hierarchy, chrome, and
finish** — not the data model or the architecture described in `frontend_imp.md`.

The visual north star (per the client's reference, the Cieden "Open IQ" call-center redesign):
> "Optimize the use of space while keeping the same functionality — condensed but functional."
Day/night themes, customizable data-dense dashboards, charts grouped logically, fast scanning.

---

## About the design files

The files in `prototype/` are **design references built in plain HTML/CSS/React (Babel-in-browser)**.
They are **not** production code to paste in. They exist to show the intended *look, density,
spacing, color, and interaction* precisely. Your job is to **recreate this design inside the real
`popcrm-web` codebase** using its established stack — **Vite + React 19 + TypeScript + Tailwind CSS v4
+ shadcn/Radix + Lucide + Recharts** — reusing the existing components in `src/components/ui/*`,
`src/components/app/*`, and the page modules in `src/features/crm/pages/*`.

Concretely: the prototype hand-rolls CSS classes (`.kpi`, `.tbl`, `.chip`, `.drawer`, …) and inline
SVG icons because it has no build step. In the real app you will express the *same* visual result
with **Tailwind utility classes mapped to the existing semantic tokens** (`bg-card`, `text-muted-foreground`,
`border-border`, etc.), **shadcn primitives** (`Sheet`, `Select`, `Tabs`, `Table`, `DropdownMenu`,
`Tooltip`), **Lucide icons**, and **Recharts** for charts. Match the pixels; use the app's idioms.

## Fidelity

**High-fidelity.** Colors, type scale, spacing, radii, density, and interactions are final and
intentional. Recreate them precisely. Where the prototype and the live token file disagree, the
**live `src/index.css` tokens win** — this redesign deliberately reuses them (see Design Tokens).

---

## Companion documents (read these too)

| File | Contents |
|---|---|
| `README.md` (this) | Philosophy, global system, tokens, component mapping, phased plan |
| `SCREENS.md` | Per-screen layout & component specs (Overview, Email, Pipeline, Accounts, Contacts, + the rest) |
| `prototype/index.html` | Runnable reference — open it in a browser to click through everything |

---

## The core idea: "dense but breathable"

The current app wastes vertical rhythm (big gaps, low data-per-screen) yet still feels plain.
The elevation fixes both at once. Five moves do most of the work:

1. **A confident, deep sidebar.** Replace the light-gray sidebar with a deep slate rail
   (`--sidebar: oklch(0.205 0.024 256)`) with grouped sections (Operate / Records / Workflow),
   per-item work badges, a brand lockup, and a live "All systems normal" health footer. This single
   change is ~60% of the "serious product" feeling. It works identically in light and dark mode.

2. **A 7-up KPI strip with sparklines + deltas.** KPI tiles are compact (≈110px tall), carry a
   trend delta chip (▲2.1%) and a faint sparkline bled into the bottom-right corner. Seven across on
   wide screens. This is dense *and* glanceable — the opposite of four giant empty cards.

3. **Real tables, not lists.** 44px rows (36px in "compact" density), uppercase micro-headers on a
   muted fill, sortable columns, hover + selected states, avatar+stack cells (primary + secondary
   line), tabular-aligned numerics, right-aligned metrics. Row click opens an inspector.

4. **Inspector drawers as the editing surface.** A 480px right-hand `Sheet` with a badge cluster
   header, AI-summary callout, description lists, inline relation pickers, and a stuck footer with the
   primary action. Every record type (opportunity, email, account, contact, …) uses the same shell.

5. **Token-driven charts.** A donut (routing health) with a centered % read-out, an area chart
   (12-week email volume vs. auto-routed), and horizontal bars (pipeline by stage). All colored from
   `--chart-1..5`, so they match everything else and reskin with the theme.

**Anti-patterns to avoid** (these are what make redesigns look empty/AI-generated):
no oversized hero sections, no card-inside-card, no giant centered empty states on primary screens,
no decorative gradients/orbs, no viewport-unit type, no full-width single-column layouts with 200px of
side margin. Fill the screen with *useful* information at a comfortable density.

---

## Design tokens

**Reuse the live theme.** The redesign's palette is the existing `src/index.css` OKLCH system —
brand blue `--primary: oklch(0.588 0.154 255)` (#327DD6), cool slate neutrals, Geist type, the
`--stage-*` pipeline chips, and `--chart-1..5`. **Do not invent new colors.** The only *additions*
this redesign makes (port these into `src/index.css` as new variables, light + dark):

```css
/* Add to :root and .dark in src/index.css */
:root {
  /* Elevated deep sidebar (replaces the light --sidebar values) */
  --sidebar:                    oklch(0.205 0.024 256);
  --sidebar-foreground:         oklch(0.880 0.012 255);
  --sidebar-muted:              oklch(0.620 0.020 256);
  --sidebar-accent:             oklch(0.280 0.028 256);
  --sidebar-accent-foreground:  oklch(0.970 0.008 255);
  --sidebar-border:             oklch(0.300 0.022 256);
  --sidebar-primary:            oklch(0.660 0.154 255);

  /* Semantic status fills for chips/badges (token-drive CrmStatusBadge) */
  --chip-success: oklch(0.930 0.055 152);  --chip-success-fg: oklch(0.380 0.090 152);
  --chip-info:    oklch(0.928 0.045 255);  --chip-info-fg:    oklch(0.420 0.110 255);
  --chip-warning: oklch(0.940 0.060 80);   --chip-warning-fg: oklch(0.430 0.090 70);
  --chip-danger:  oklch(0.936 0.052 25);   --chip-danger-fg:  oklch(0.500 0.150 27);
  --chip-neutral: oklch(0.930 0.008 255);  --chip-neutral-fg: oklch(0.430 0.016 255);

  --border-strong: oklch(0.845 0.012 255);   /* hover borders, dividers */
  --success: oklch(0.600 0.130 152);
  --warning: oklch(0.720 0.138 62);
}
.dark {
  --sidebar:                    oklch(0.150 0.018 256);
  --sidebar-foreground:         oklch(0.880 0.012 255);
  --sidebar-muted:              oklch(0.560 0.020 256);
  --sidebar-accent:             oklch(0.235 0.022 256);
  --sidebar-accent-foreground:  oklch(0.960 0.008 255);
  --sidebar-border:             oklch(1 0 0 / 8%);
  --sidebar-primary:            oklch(0.680 0.150 255);

  --chip-success: oklch(0.300 0.060 152);  --chip-success-fg: oklch(0.840 0.090 152);
  --chip-info:    oklch(0.300 0.060 255);  --chip-info-fg:    oklch(0.840 0.110 255);
  --chip-warning: oklch(0.320 0.060 80);   --chip-warning-fg: oklch(0.870 0.090 80);
  --chip-danger:  oklch(0.320 0.080 27);   --chip-danger-fg:  oklch(0.840 0.120 27);
  --chip-neutral: oklch(0.300 0.012 255);  --chip-neutral-fg: oklch(0.780 0.016 255);

  --border-strong: oklch(1 0 0 / 16%);
  --success: oklch(0.700 0.130 152);
  --warning: oklch(0.780 0.130 70);
}
```

Wire the new tokens into Tailwind v4 by adding matching `--color-*` lines to the existing
`@theme inline { … }` block (mirroring how `--color-sidebar`, `--color-chart-1` etc. are already
mapped), e.g. `--color-chip-success: var(--chip-success);` so `bg-chip-success`/`text-chip-success-fg`
become valid utilities. The full prototype values are in `prototype/theme.css` (`:root` and `.dark`).

### Type scale (Geist — already installed)

| Use | Size / weight / tracking |
|---|---|
| Page title | 19px / 650 / -0.02em |
| KPI value | 25px / 680 / -0.025em, tabular |
| Section/card heading | 13px / 650 / -0.01em |
| Drawer record title | 16px / 650 |
| Body / table cell | 12.5–13px / 400–600 |
| Secondary / meta | 11–11.5px / 400, `--muted-foreground` |
| Micro header (table th) | 11px / 600 / 0.04em / uppercase |
| Base `font-size` | 13px (the app runs slightly tighter than browser default) |

### Spacing, radius, shadow

- **Radii:** cards `14px`, KPI tiles/opp-cards `11–13px`, inputs/buttons `9px`, chips `99px`,
  table wrapper `13px`. (The repo's `--radius: 0.625rem` drives `rounded-lg`; cards use a touch more.)
- **Page padding:** `12px 22px` body, `9px 22px` sticky toolbars, `14px 22px 0` page head. Tight rhythm — the app is intentionally dense to maximize data-per-screen without feeling cramped.
- **Row heights:** table 40px / 32px compact; topbar & sidebar-brand 52px; buttons 34px (28px sm).
- **Shadows:** very restrained — `--shadow-xs/sm` on tiles & cards on hover, `--shadow-lg` only on
  drawers and the floating tweaks/command surfaces. No ambient drop shadows on flat content.
- **Gaps:** dashboard sections `16px`; KPI grid `12px`; inside cards `9–14px`. Tight, even rhythm.

---

## Global components → map to existing files

| Prototype element | Real codebase target | Notes |
|---|---|---|
| Deep sidebar w/ grouped nav, badges, health footer | `src/components/app/AppSidebar.tsx` + `src/app/navigation.ts` | Add section grouping (Operate/Records/Workflow) to nav config; recolor to `--sidebar-*`; keep `NavLink` active state but strengthen it (see below) |
| Topbar: search-as-button, theme toggle, refresh, build chip, avatar menu | `src/components/app/AppHeader.tsx` | Already ~90% there. Add a **theme toggle** (light/dark) and make the active-nav + search prominent. Keep `⌘K` command palette (`CommandSearch.tsx`). |
| KPI tile w/ delta + sparkline | `src/components/app/MetricCard.tsx` | Extend props: `delta`, `deltaDir`, `spark:number[]`. Sparkline = tiny Recharts `<Area>` or inline SVG, absolutely positioned bottom-right at ~0.5 opacity. |
| Status chip | `src/components/app/StatusBadge.tsx` + `src/features/crm/components/CrmStatusBadge.tsx` | Re-point tone→token classes to the new `--chip-*` vars. Keep the `routingTone/taskTone/approvalTone` maps in `constants.ts`. |
| Stage chip | existing `stageChipClass()` in `constants.ts` | Already token-driven — no change needed, just used more prominently. |
| Sortable dense table | `src/components/app/DataTable.tsx` | Already has `Column`, sort, hide-below. Tighten row height, add uppercase muted `th`, avatar+stack cell pattern, right-aligned numeric columns, selected-row state. |
| Inspector drawer shell | `src/components/app/DetailDrawer.tsx` (wraps shadcn `Sheet`) | Standardize: badge cluster header, scroll body, sticky footer w/ primary action. All domain drawers compose it. |
| Charts (donut/area/bars) | new, with **Recharts** via `src/components/ui/chart.tsx` | Donut = `PieChart`+`Pie innerRadius`; area = `AreaChart` w/ gradient; bars = horizontal `BarChart`. Color via `var(--chart-n)` / `var(--color-*)` as the existing `OverviewPage.tsx` already does. |
| Tweaks panel (light/dark, density) | **Not a product feature** — it's a prototype affordance | Ship the **theme toggle** for real (persist to `localStorage`, toggle `.dark` on `<html>`). "Density" can be a real user setting or dropped; your call. |

### Strengthen the active-nav state (small but high-impact)

The current sidebar active state is too subtle. Use:
```
active item: background = mix(sidebar-primary 18%, sidebar-accent); color #fff;
             inset 0 0 0 1px mix(sidebar-primary 30%, transparent);
             a 3px left accent bar (sidebar-primary) with a soft glow;
             icon tinted toward sidebar-primary.
```
See `.nav-item.active` in `prototype/theme.css`.

---

## Interactions & behavior

- **Navigation:** React Router (already in place). Sidebar item → route; active state from `NavLink`.
  KPI tiles and "View all" links navigate (`navigate('/email')`, etc.). Deep-link selected records via
  query params (`/email?message=<id>`) as `frontend_imp.md` specifies.
- **Tables:** click header to sort (asc → desc → none); click row → open drawer; hover highlights row.
- **Drawers:** open from row/card click; `Esc` and scrim-click close; focus trap via shadcn `Sheet`.
  Footer holds the primary action (Apply routing / Save changes); secondary/ghost on the left.
- **Email routing drawer:** status `Select`, account/department/opportunity **combobox** (shadcn
  `Combobox` — native `<select>` with thousands of accounts is unacceptable; use the existing
  `Combobox.tsx`), routing-method read-out with a confidence meter, "Create ignore rule" ghost action.
- **Pipeline board:** horizontal scroll of stage columns with sticky headers + counts; compact cards
  (title, AI-summary sparkle, account, licensor chip, PO/SO mono, est. value, close date); click → drawer
  with an inline stage-mover (chips). Drag-and-drop stage change is a fast-follow, not required for v1.
- **Theme toggle:** flips `.dark` on `documentElement`, persists to `localStorage`. All tokens already
  have dark values — nothing else to do.
- **Transitions:** drawer slide-in 220ms `cubic-bezier(.22,.61,.36,1)`; scrim fade 150ms; hover/color
  120ms; bar/width chart fills ~500ms. Respect `prefers-reduced-motion`.
- **Loading/empty/error:** keep the existing `states.tsx` (skeletons / `ErrorState`) — but make empty
  states *inline and compact* (icon + one line inside the table/card), never a full-screen void on a
  primary operational screen.

## State management

No new global state needed beyond what exists (`CrmDataContext`, `useRecordSelection`). Add:
- `theme: 'light'|'dark'` (localStorage-persisted; default from `prefers-color-scheme`).
- Per-table local UI state: `sort {key,dir}`, `query`, segment/filters, `selectedId` (already patterned).
- Keep all reads/writes through the existing Directus `api.ts`.

---

## Assets

- **Icons:** Lucide (already a dependency). The prototype's inline SVGs map 1:1 to Lucide names —
  `LayoutDashboard, Route/GitBranch, Mail, Building2, Contact, CalendarDays, NotebookTabs, ListTodo,
  ShieldCheck, Settings2, Search, RefreshCcw, Bell, Sparkles, Filter, Moon, Sun, ArrowUpRight, ...`
- **Fonts:** Geist + Geist Mono (already installed via `@fontsource-variable/geist`). Mono is used for
  PO/SO numbers, build hash, routing aliases.
- **No raster/brand art** is required. The brand mark is a simple rounded-square glyph with the brand
  gradient; replace with POP Creations' real logo if available.

---

## Files in this bundle

```
design_handoff_popcrm_elevation/
  README.md          ← this file (philosophy, tokens, global system, mapping, plan)
  SCREENS.md         ← per-screen layout & component specs
  prototype/
    index.html       ← open in a browser to explore the live reference
    theme.css        ← the full token set (:root + .dark) and every component style — the source of truth for pixels
    data.js          ← realistic POP Creations mock data (shapes mirror src/lib/types.ts)
    icons.jsx        ← inline icon set (map to Lucide)
    components.jsx   ← shared: charts, KPI, chips, DataTable, Drawer, format helpers
    drawers.jsx      ← OpportunityDrawer, EmailDrawer, AccountDrawer, ContactDrawer
    screens.jsx      ← OverviewPage, EmailPage, PipelinePage, AccountsPage, ContactsPage
    app.jsx          ← shell (Sidebar, Topbar), tweaks, routing state
```

`prototype/theme.css` is the **authoritative source for every measurement, color, radius, and
shadow.** When in doubt about a value, read it there.

---

## Suggested implementation order

Follow `frontend_imp.md`'s phasing; this redesign slots into it:

1. **Tokens first.** Add the new `--sidebar-*`, `--chip-*`, `--border-strong`, `--success/--warning`
   vars to `src/index.css` (light + dark) and map them in `@theme inline`. Verify existing shadcn
   components still render. *Nothing else should start before this.*
2. **Shell.** Recolor + regroup `AppSidebar`; strengthen active state; add the theme toggle to
   `AppHeader`. The app should immediately feel like a different product.
3. **Shared components.** Upgrade `MetricCard` (delta+sparkline), `DataTable` (density, micro-headers,
   avatar-stack cells, numeric alignment, selected state), `CrmStatusBadge`/`StatusBadge` (token chips),
   `DetailDrawer` (standard header/footer). Build the three Recharts chart components.
4. **Overview dashboard.** Reuse the layout in `SCREENS.md` — 7 KPIs, area + donut row, bars + needs-routing
   row, meetings + approvals row.
5. **Email Routing.** Dense table + sticky segments + right rail (worker cadence, ignore rules) + the
   manual-routing drawer with comboboxes. Highest-value workflow — get it fast and precise.
6. **Pipeline, Accounts, Contacts**, then **Meetings, Notes, Tasks, Approvals, Settings** (same patterns).

After each phase: `npm run build && npm run lint` (no new warnings beyond the known `auth.tsx` ones),
check light + dark, check 1440px and mobile.

## Definition of done

- Looks like a premium production CRM at a glance; reads as *dense and intentional*, not empty.
- Deep sidebar, sparkline KPIs, real sortable tables, standardized inspector drawers, token charts —
  all present and consistent across screens.
- Light **and** dark themes both correct (toggle persists).
- Every existing route, workflow, and Directus call still works. No data-model changes.
- Build + lint clean; verified at desktop and mobile widths.
