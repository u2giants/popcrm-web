# SCREENS — POP CRM elevation, screen-by-screen specs

Read `README.md` first. All colors reference the tokens defined there / in `prototype/theme.css`.
Each screen below maps to an existing module in `src/features/crm/pages/`. Recreate the layout and
density precisely using Tailwind + the existing shadcn/Radix components.

Shared scaffold for every screen:
- **Page head** (`18px 24px 0`): title (19px/650) + sub (12.5px muted) on the left; actions on the right.
- **Sticky toolbar** (`12px 24px`, bottom border, blurred translucent bg) for search / segments / filters.
- **Page body** (`16px 24px 28px`).

---

## 1. Overview  → `OverviewPage.tsx`  (route `/`)

**Purpose:** 10-second operational read of the whole business.

**Layout (top → bottom, 16px gaps):**

1. **KPI strip** — `grid-template-columns: repeat(7, 1fr)` (→ 4 at ≤1500px → 2 at ≤860px), 12px gap.
   Seven tiles: Accounts · Contacts · Open programs · Needs routing · Meetings · Open tasks · Approvals.
   Each tile (`≈110px`): label (11.5px muted) + 26px rounded icon chip top-right; value (25px/680
   tabular); footer row = delta chip + caption; faint sparkline bled into bottom-right corner.
   - Delta chip: `▲2.1%` green (`--chip-success`), `▼12` red (`--chip-danger`), `→ flat` (muted).
   - Tone: "Open programs" uses accent icon; "Needs routing" uses danger icon + danger value when > 0.
   - Whole tile is a button → navigates to its page.

2. **Row: Email volume (≈1.4fr) + Routing health (1fr).**
   - *Email volume* card: header "Email volume · 12-week ingest vs. auto-routed" + 2-item legend
     (Ingested = `--chart-1` solid, Auto-routed = `--chart-3` dashed). Body = Recharts `AreaChart`,
     ~150px tall: gradient fill under the "ingested" line, dashed "routed" line, faint dashed
     horizontal gridlines at 25/50/75%, small dot markers on the ingest line.
   - *Routing health* card: header + "Open queue →" link. Body = donut (`PieChart` + `Pie` innerRadius
     ≈48) with a **centered overlay** showing the auto-routed % (19px/700) + caption; to its right a
     legend list — swatch + label + right-aligned tabular count. Series: Routed, Company+dept,
     Company only, Skipped, Needs routing (colors `--chart-3/1/2`, `--muted-foreground`, `--chart-4`).

3. **Row: Pipeline distribution (1.4fr) + Needs routing (1fr).**
   - *Pipeline distribution* card: header + total value (e.g. "$18.40M total value"). Body = horizontal
     bars, one per stage: 128px label / flexible track (9px tall, rounded, `--muted` track, `--chart-1`
     fill, 500ms width transition) / 34px right-aligned count.
   - *Needs routing* activity card (see Activity Card spec).

4. **Row: Recent meetings + Pending approvals** — two Activity Cards.

**Activity Card spec:** card with header (icon + title + "View all →" link) over a divided list.
Each row (`9px 16px`, hover tint): primary (12.5px/550 truncate) over secondary (11px muted truncate),
trailing chip/date on the right. Empty = one compact muted line, never a giant void.

**Page actions:** `Fireflies online` success chip · `Export` ghost button · `New program` primary.

---

## 2. Email Routing  → `EmailRoutingPage.tsx`  (route `/email`)

**Purpose:** the flagship custom workflow — triage Outlook-ingested mail to account/dept/program.

**Toolbar:** a **segmented control** (Needs routing / Routed / Skipped / All) each with a count pill
(active pill tinted primary); spacer; search box (subject/sender); `Filters` button.

**Body grid:** `grid-template-columns: 1fr 320px`, 14px gap.

- **Left — dense table** (`DataTable`): columns
  - *Date* (116px, mono 11.5px muted, sortable)
  - *Subject* (max ~360px): primary subject (truncate) over sender (11px muted truncate)
  - *Account* (sortable; "—" muted when unrouted)
  - *Method* outline chip (Alias match / AI classify / Domain match / Manual)
  - *Status* token chip with dot (`routingTone` map)
  Row click → **Email drawer**. Empty (Needs routing tab) = "Inbox zero on routing." inline.

- **Right rail** (two cards):
  - *Worker cadence*: rows "Outlook ingest / every 15 min", "Reroute pass / every 6 hrs",
    "Contact sync / daily", "Summaries / every 6 hrs" (outline chips); divider; "Last ingest ·
    ● 4 min ago" with a green health dot.
  - *Ignore rules · N active*: an input + `+` primary icon-button to add; list of rule cards
    (pattern bold, "Contains · 412 skipped" sub) on a muted fill.

**Email drawer (480px):** header = status chip + subject (16px) + "From … · <datetime>". Body:
- *Message* section: body preview in a muted rounded panel.
- *Manual routing* section: Status `Select`; Account, Department, Opportunity **comboboxes**
  (use `Combobox.tsx`; opportunities filtered to the chosen account).
- *Routing method* DL: detected-by + a confidence meter (6px progress bar + %).
Footer: `Create ignore rule` ghost (left) · spacer · `Cancel` · `Apply routing` primary.

---

## 3. Pipeline  → `PipelinePage.tsx`  (route `/pipeline`)

**Purpose:** program opportunities across 8 stages.

**Toolbar:** search (name/retailer/PO/SO) · Account `Select` · Licensor `Select` · spacer ·
Board/List segmented toggle.

**Board:** horizontal-scroll flex of **stage columns** (286px each, `--muted` 60% fill, bordered,
radius 13). Column header (sticky, blurred): stage chip (`stage-*` token) + count pill.
**Opportunity card:** title (12.5px/600, 2-line clamp) with a primary `Sparkles` if `ai_summary`;
meta block (account truncate, licensor outline chip, PO/SO mono); footer (top border): est. value
(`amount`, 12px/650) + close date (10.5px muted). Hover: primary-tinted border + `shadow-sm` + 1px lift.
Card click → **Opportunity drawer**.

**Opportunity drawer:** header = stage chip + licensor outline chip, then name + "account · dept".
Body: AI-summary callout (bordered, primary-tinted bg, `Sparkles` head) when present; *Program details*
DL (stage, account, department, licensor, season, est. value, close date, PO, SO); *Move stage* row of
clickable stage chips (current = full opacity + ring, others dimmed); *Related* list (linked tasks with
status chips). Footer: `Close` · `Save changes` primary.

`stage_*` chips (from existing `stageChipClass`): Directive Received=dev/blue,
Design In Progress=concept/violet, Buyer Review=review/amber, Pricing & Sampling=onhold/yellow,
Awaiting Sales Order=production/orange, In Production=approved/green, Shipped=shipped/teal, Closed=neutral.

---

## 4. Accounts  → `AccountsPage.tsx`  (route `/accounts`)

**Purpose:** retailer accounts list with relationship context.

**Toolbar:** search (name/domain) · Status `Select` (Active/Prospect/At risk) · Chain `Select`
(Mass/Club/Department/Grocery/Specialty) · spacer · "12 of 3,744 accounts" count.

**Table columns:**
- *Account*: 20px rounded avatar (hue from name) + name (600) over domain (11px muted)
- *Status*: token chip with dot (`STATUS_TONE`: Active=success, Prospect=info, At risk=warning)
- *Chain*: outline chip
- *Contacts* (right-aligned tabular, sortable)
- *Programs* (right-aligned tabular, sortable)
- *YTD revenue* (right-aligned `$X.XXM` 650, sortable)
Row click → **Account drawer**.

**Account drawer:** header = status + chain chips, name, domain. Body: two mini stat cards
(YTD revenue / Open programs); *Account* DL (domain, status, chain, routing aliases [mono 11px],
contacts); *Contacts* list (avatar + name + title); *Programs* list (name + "$X.XXM · season" + stage chip).
Footer: `Close` · `Open account` primary.

---

## 5. Contacts  → `ContactsPage.tsx`  (route `/contacts`)

**Purpose:** buyer/merchant contacts across accounts.

**Toolbar:** search (name/email) · Type `Select` · spacer · "N of 8,612 contacts" count.

**Table columns:**
- *Contact*: 24px avatar (hue from surname) + "First Last" (600) over email (11px muted truncate)
- *Title* (truncate ≤200px, sortable)
- *Account* (sortable)
- *Department* (muted, or "—")
- *Type* info chip (Buyer / DMM / Assistant / Exec)
Row click → **Contact drawer** (DL: email link, title, account, department, type, scope; footer
`Close` · `Compose` primary).

---

## 6–10. Remaining screens (now built in the prototype — same patterns)

> **Status:** these are now **fully built** in `prototype/` (not placeholders). Each uses the `ListBar`
> one-row header + `DataTable` (or a sectioned layout for Settings) + a domain drawer. Specs below
> match what's in the prototype.

- **Meetings** (`MeetingsPage.tsx`, `/meetings`): table (Date · Meeting · Participants · Account ·
  Source[Fireflies/Manual chip]); drawer with Summary, Action items (checklist), Participants, linked
  account/contact/opportunity, Fireflies transcript id. Fireflies notes should feel first-class.

- **Notes** (`NotesPage.tsx`, `/notes`): table or stacked list (Title · Account · Opportunity · Source);
  "New note" opens a drawer form (title, body textarea, relation comboboxes). Polished, intentional create.

- **Tasks** (`TasksPage.tsx`, `/tasks`): table **or** a compact board by status
  (Todo/In progress/Done/Canceled). Columns/cards: title · status chip (`taskTone`) · due date
  (red when overdue) · linked program · assignee avatar. Inline status change.

- **Approvals** (`ApprovalsPage.tsx`, `/approvals`): table focused on pending licensor approvals —
  Name · Licensor · Status chip (`approvalTone`: Approved=success, Rejected=danger, Revision=warning,
  Submitted=info, Pending=neutral) · Submitted · Program · Latest comment (truncate). Drawer shows
  metadata + comment thread + linked opportunity. Reads as an approval tracker, not leftover CRUD.

- **Settings** (`SettingsPage.tsx`, `/settings`): sectioned settings page —
  *AI model config* (4 `Select`s: email_routing_model, fireflies_routing_model, transcript_split_model,
  opportunity_summary_model, from the `AI_MODELS` enum); *Worker / system health* (cadence + last-run
  cards with health dots); *Ignore rules* management; *Integration endpoints* (read-only, no secrets).
  Modern SaaS settings layout: left section nav or stacked labeled cards with description-above-field.

- **Login** (`LoginPage.tsx`): restrained, *not* a marketing hero. Centered card on a subtly tinted
  background; brand mark + "POP CRM"; "Continue with Microsoft" primary; email/password fallback below a
  divider; compact error/loading states. Consider a split layout with a dark brand panel (using the
  `--sidebar` slate) on the right at ≥lg for a more flagship feel — optional.

---

## Density toggle (optional product setting)

The prototype exposes a Comfortable/Compact toggle that switches table row height 44px ↔ 36px (and
trims `th` padding). If you ship it, persist to localStorage and gate it with a `density-compact`
class on the app root, exactly as the prototype does. If not, default to **Comfortable** (44px).

## Responsive notes

- **≥1500px:** 7-up KPIs, full multi-column dashboard rows.
- **≤1500px:** KPIs → 4-up; dashboard rows stack to single column where needed.
- **≤860px:** KPIs → 2-up; right rails drop below the table; board stays horizontally scrollable;
  tables hide lower-priority columns (`hideBelow` already supported by `DataTable`) or scroll-x.
- Sidebar collapses to a mobile `Sheet` drawer (already wired in `AppLayout.tsx`). Drawers go full-bleed
  (`max-w-[94vw]`).
