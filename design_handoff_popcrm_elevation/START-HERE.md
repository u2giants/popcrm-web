# START HERE — handing this package to Claude Code

This folder is a **design handoff**: a runnable HTML prototype (`prototype/`) plus implementation
docs. It is meant to be recreated inside the real `popcrm-web` repo (React + Vite + TS + Tailwind v4 +
shadcn). Read `README.md`, then `SCREENS.md`, then `ADDENDUM-v2.md`.

## Step 1 — Download
Click the download card in the chat (or re-request it). You'll get
`design_handoff_popcrm_elevation.zip`.

## Step 2 — Put it in the repo
Unzip it into your local `popcrm-web` checkout, e.g.:
```
popcrm-web/
  src/ ...
  design_handoff_popcrm_elevation/   ← drop the unzipped folder here
```
Commit it on a branch (`git checkout -b crm-elevation`) so Claude Code can see it and you can diff.

## Step 3 — (optional) Look at the prototype yourself
Open `design_handoff_popcrm_elevation/prototype/index.html` in a browser. Click around — Pipeline cards
open the record modal; tables have Filters/Columns + draggable/resizable headers; the Tweaks button
toggles light/dark. This is the visual target.

## Step 4 — Open the repo in Claude Code and paste this kickoff prompt

> We're doing a visual elevation of this app. Read
> `design_handoff_popcrm_elevation/README.md`, then `SCREENS.md`, then `ADDENDUM-v2.md`, and open the
> reference prototype under `design_handoff_popcrm_elevation/prototype/` (start with `index.html`,
> `theme.css`, `screens.jsx`, `components.jsx`, `record-modal.jsx`).
>
> Implement this design **in our existing stack** (Vite + React 19 + TS + Tailwind v4 + shadcn/Radix +
> Lucide + Recharts). Do NOT ship the prototype HTML and do NOT change the Directus data layer, routes,
> or custom workflows. The prototype is a visual reference; recreate its look/density/interactions with
> our components and the OKLCH tokens in `src/index.css`.
>
> Work in phases, build + lint after each, and stop for my review between phases:
> 1. **Tokens** — add the new `--sidebar-*`, `--chip-*`, `--border-strong`, `--success/--warning` vars
>    (light + dark) to `src/index.css` and map them in `@theme inline`.
> 2. **Shell** — recolor/regroup `AppSidebar` (colored icon tiles, sections), strengthen the active
>    state, add a light/dark toggle to `AppHeader`.
> 3. **Shared components** — `MetricCard` (delta + sparkline), `DataTable` (density, uppercase headers,
>    avatar-stack cells, per-column sort + filter, resize, reorder, show/hide — TanStack Table or
>    AG-Grid React), `CrmStatusBadge`/`StatusBadge` token chips, `DetailDrawer`, the record modal
>    (shadcn Dialog), and the three Recharts charts.
> 4. **Screens** — Overview, then Email Routing, Pipeline, Accounts, Contacts, Meetings, Notes, Tasks,
>    Approvals, Settings — each with the one-row `ListBar` header.
>
> Match spacing, type scale, radii, and the colorful-but-restrained iconography exactly. Keep the
> existing shadcn primitives; add only what's listed. Confirm light + dark both hold up.

## Step 5 — Review per phase
Claude Code will pause between phases. Compare against the prototype in your browser, request tweaks,
and move on. The docs are self-contained — a dev (or Claude Code) who wasn't in our chat can build from
them alone.

---
**Files:** `README.md` (system + tokens + mapping + plan) · `SCREENS.md` (all 10 screens) ·
`ADDENDUM-v2.md` (record modal, AG-Grid tables, iconography, one-row headers) · `screenshots/`
(static reference of every screen + dark mode) · `prototype/` (runnable reference).
`prototype/theme.css` is the source of truth for every pixel value.
