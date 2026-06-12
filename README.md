# popcrm-web

CRM frontend for POP Creations — a React + Vite + TypeScript + Tailwind v4 + shadcn/ui SPA on the shared Directus backend (`https://data.designflow.app`). It stores no data of its own.

Target domain: **https://crm.designflow.app**. Backend repo: `u2giants/directus`. Sibling apps: `poppim-web` and `popdam-web`.

**Start here:** read [`AGENTS.md`](AGENTS.md) — the canonical operating guide and documentation router for developers and AI sessions.

Deploy: push to `main` → GitHub Actions builds + publishes `ghcr.io/u2giants/popcrm-web` → Coolify pulls and runs it. See [`docs/deployment.md`](docs/deployment.md).

## Run

```bash
npm install
npm run dev
npm run build
```

Set `VITE_DIRECTUS_URL` in `.env` when you need a non-production backend. It defaults to `https://data.designflow.app`.
