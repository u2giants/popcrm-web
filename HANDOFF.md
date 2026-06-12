# HANDOFF.md — popcrm-web

Current handoff state:

- Production app: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Backend: `https://data.designflow.app`
- Correct project name: `popcrm-web`
- Deploy: push to `main` → GitHub Actions builds + pushes `ghcr.io/u2giants/popcrm-web` → Coolify app `popcrm-web` pulls and runs it. See `docs/deployment.md`.

The app is a CRM frontend using custom Directus CRM collections and custom worker automation. It is not the Directus Simple CRM template.

The Tailwind Plus Application UI redesign described in `frontend_imp.md` is implemented: a sidebar app shell, route-per-page modules (Overview, Pipeline, Accounts, Contacts, Email Routing, Meetings, Notes, Tasks, Approvals, Settings), shared app components (DataTable, DetailDrawer, MetricCard, …), domain drawers, a global command palette, and an Overview dashboard built with shadcn charts (Recharts). All surfaces consume the shared OKLCH token theme. Charts use shadcn/Recharts rather than Tremor (Tailwind v4 + React 19 compatibility).
