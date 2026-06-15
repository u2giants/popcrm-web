# Screenshots — POP CRM elevation (V1)

Static reference captures of every screen, at ~920px-wide preview. Light theme unless noted.
These are reference only — the **runnable prototype** in `../prototype/index.html` is the source of
truth (and shows interactions the stills can't).

| File | Screen |
|---|---|
| `01-overview.png` | Overview dashboard (KPIs, email-volume chart) |
| `02-pipeline.png` | Pipeline board (stage columns, program cards) |
| `03-email-routing.png` | Email Routing (segments, table, worker/ignore-rules rail) |
| `04-accounts.png` | Accounts (one-row header, dense table) |
| `05-contacts.png` | Contacts |
| `06-meetings.png` | Meetings |
| `07-notes.png` | Notes |
| `08-tasks.png` | Tasks (status segments, overdue dates) |
| `09-approvals.png` | Approvals (licensor submissions) |
| `10-settings.png` | Settings (AI model config tab) |
| `11-overview-dark.png` | Overview in **dark theme** |

## Not captured as a still: the Record Modal & inspector drawers
The two-pane **record modal** (Pipeline card click) and the slide-over **inspector drawers** (row click
on any table) are full-screen overlays with a `backdrop-filter` blur, which the static screenshot tool
can't rasterize. They render correctly in any real browser — open `../prototype/index.html`, go to
**Pipeline**, and click any program card to see the modal; click any table row to see a drawer.

Wider viewports show the inline subtitle next to each page title (it auto-hides below ~1080px, which is
why it's not visible in these ~920px captures).
