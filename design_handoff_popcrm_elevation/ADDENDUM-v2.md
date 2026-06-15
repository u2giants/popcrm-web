# ADDENDUM v2 — Record modal, AG-Grid tables, colorful iconography

This addendum extends `README.md` / `SCREENS.md` with three capabilities added after the first round.
Everything in the base docs still applies; this layers on top.

---

## 1. Record detail **modal** (replaces the slide-over for opportunities)

Clicking a pipeline card now opens a **large centered two-pane modal** (not the 480px right drawer).
Reference file: `prototype/record-modal.jsx` + `.rec-*` styles in `prototype/theme.css`.

**Shell:** centered overlay, `width: min(1160px, 96vw)`, `height: min(880px, 92vh)`, radius 16,
`--shadow-lg`, scrim with blur, `Esc`/scrim-click to close, pop-in animation
(`scale .97→1`, 200ms). Collapses to single-column (activity pane hidden) under 880px viewport.

**Top bar (48px):** back chevron · breadcrumb (`POP Creations ▸ Pipeline ▸ <Stage>`) · spacer ·
`Ask AI` · `Share` · expand · close.

**Left pane (`rec-main`, scrolls):**
- Type chip ("Program", colored dot) + file count.
- Record title — 24px / 700 / -0.025em.
- AI strip — violet-tinted (`--chart-5`) callout: "Ask AI to draft the buyer follow-up…".
- **Properties grid** — 2 columns of `label → value` rows (Status stage-chip, Owner avatar,
  Close date, Priority flag chip, Account, Est. value, Season, Licensor). Label col 142px with a
  muted icon; at the real ≈784px pane width both columns breathe. Collapse to 1 column if the pane
  is narrow.
- **Description** section (bordered header) with the spec text + mono file path / PO / SO.
- **Fields** section — the colorful part: each row is a **colored rounded icon tile** + field name +
  right-aligned value (Buyer, Licensor due date, Factory, Category, Customer/Retailer, Date factory
  selected, Licensor, Est. program value). Each field type owns a hue (see colors below).
- **Move stage** — row of clickable stage chips (current = full opacity + ring).

**Right pane (`rec-side`, fixed 376px):** "Activity" header (search + filter) · scrollable feed of
events (`▸ created this program`, `↗ Stage → …`, `✦ AI summary refreshed`) and **comments**
(avatar + name + time + text + optional file-attachment chip) · sticky **composer** at the bottom
(rounded input + paperclip / @ / AI tools + a primary send button).

**Build it in `popcrm-web` as:** a shadcn `Dialog` (not `Sheet`) sized large, OR a custom centered
overlay. Reuse `OpportunityDrawer`'s data wiring; just change the container and add the activity rail.
Comments/activity can be a new `crm_note`-backed thread or a simple read view for v1 — the *layout* is
the deliverable. Other record types (account, contact, email) can keep the **drawer** OR graduate to
this modal; pick per density of content (programs/tasks → modal; quick records → drawer).

---

## 2. AG-Grid-style tables (sort · filter · resize · reorder · show-hide)

Reference: the rewritten `DataTable` in `prototype/components.jsx` + `.tbl-*`, `.th-*`, `.float-*`,
`.colmenu-*` styles. Every list screen uses it.

**Header row, per column:**
- Click the label → **sort** (asc → desc → off); caret shows direction.
- A **funnel icon** per filterable column → opens the floating-filter row and focuses that column.
- A **resize handle** on the right edge → drag to resize (live width via `<colgroup>`; min width
  respected). Cursor `col-resize`; the handle shows a primary hairline on hover/active.
- The whole `<th>` is **draggable** → drop on another header to **reorder** columns.

**Floating filter row** (toggle with the `Filters` button, or auto-shown when a funnel is clicked):
a compact search input under each column header; filters are **per-column** and **AND-combined**;
filter text matches `col.filterVal(row)` (falls back to `col.sortVal`). The toolbar shows the live
`N rows · M filters` count.

**Table toolbar** (thin bar above the grid): row/filter count · `Filters` toggle · **`Columns`**
menu — a popover of checkboxes to **show/hide** columns, each row draggable to reorder. State
(`order`, `widths`, `hidden`, `filters`, `sort`) is local to the table.

**Build it in `popcrm-web` as:** the project already plans a real data grid. The cleanest path is
**TanStack Table** (headless) for sorting/filtering/column-ordering/visibility/sizing state +
the existing shadcn `Table` markup for rendering, OR adopt **AG-Grid React** directly if you want
its built-in floating filters, column menu, resize and reorder out of the box (it themes to CSS vars —
match the tokens). Either way the *behaviors and header affordances above are the spec*. Keep the
40px/32px density, uppercase muted headers, avatar-stack cells, and right-aligned numerics from v1.

**Column config shape** (what each table passes):
```
{ key, header, cell(row), sortVal?(row), filterVal?(row), width?, minWidth?, tdStyle? }
```

---

## 3. Colorful iconography (de-blandifying)

The app was too monochrome. Color was added **deliberately and sparingly** — icons and accents, never
backgrounds:

- **Sidebar nav** — each item icon sits in a **colored rounded tile** (subtle gradient `color`→darker).
  Hues: Overview 255 (blue) · Pipeline 300 (violet) · Email 25 (red) · Accounts 200 (cyan) ·
  Contacts 165 (teal) · Meetings 60 (amber) · Notes 130 (green) · Tasks 95 (lime) · Approvals 340
  (magenta) · Settings neutral. All at ≈`oklch(0.6–0.66 0.15–0.17 H)`.
- **Dashboard KPI tiles** — each KPI icon is a **soft tint** of its destination page's hue
  (`color-mix(<hue> 15%, transparent)` bg, hue-colored glyph) and its sparkline uses the same hue.
  "Needs routing" stays red/danger.
- **Record-modal field tiles** — colored per field type (Buyer=blue, Licensor date=violet,
  Factory=amber, Category=green, Customer=cyan, Date=red, Licensor=magenta, Value=emerald).
- Avatars are hue-derived from the name. Status/stage chips keep the existing token palette.

**Rule for the build:** color lives on **icons, avatars, chips, sparklines, and 1px accents** — keep
surfaces neutral (`--card` / `--background`). This reads "rich and considered," not "rainbow."
Map every hue to a token or an `oklch()` literal at consistent L/C so light + dark both hold up.

---

## 4. One-row list header (space efficiency)

List screens (Accounts, Contacts, Email Routing) no longer stack a title row above a separate filter
toolbar. Everything sits on **one row** (`.list-head`): **title · subtitle · [spacer] · search ·
primary action · count** — e.g. `Accounts · Retailer accounts, customer status… · [search] · + New
account · 12 of 3,744`. The standalone filter `<select>`s (All statuses, All chain types, All types)
were **removed** — that filtering now lives in the AG-Grid column headers (funnel + floating row).
Email keeps its segmented control (Needs routing / Routed / Skipped / All) inline in the same row.
The subtitle drops on narrow viewports (`≤1080px`) to protect the controls. Net effect: one full row
of vertical space reclaimed per screen, pulling the grid/board/dashboard up.
**All primary screens use it** — Accounts, Contacts, Email Routing, **Pipeline** (account + licensor
selects and the Board/List toggle ride in the header `extra` slot), and **Overview** (Fireflies chip +
Export + New program in the `action` slot, no search). On very crowded headers the row may wrap below
~1100px; that's acceptable since target use is wide desktop. Reference: `ListBar` in
`prototype/screens.jsx` + `.list-head` in `theme.css`.

---

## Updated file list

`prototype/record-modal.jsx` is new. `components.jsx` (DataTable + Kpi), `app.jsx` (colorful nav),
`screens.jsx` (KPI colors, modal wiring, `ListBar` one-row headers), `icons.jsx` (added
grip/flag/send/expand/at/paperclip/factory), and `theme.css` (all `.rec-*`, `.th-*`, `.float-*`,
`.colmenu-*`, `.nav-ico`, `.list-head` styles, and tighter global spacing) were updated.
Open `prototype/index.html` and click a Pipeline card to see the modal; open any table's `Filters` /
`Columns` controls and drag a column edge to see the grid behaviors.
