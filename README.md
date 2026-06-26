# popcrm-web

CRM frontend for POP Creations — a React + Vite + TypeScript + Tailwind v4 + shadcn/ui SPA on the shared Supabase backend (`https://qsllyeztdwjgirsysgai.supabase.co`). It stores no data of its own.

Target domain: **https://crm.designflow.app**. Preview alias: **https://crm-dev.designflow.app**. Sibling apps: `poppim-web` and `popdam-web`.

**Start here:** read [`AGENTS.md`](AGENTS.md) — the canonical operating guide and documentation router for developers and AI sessions.

Deploy: push to `main` → GitHub Actions builds + publishes `ghcr.io/u2giants/popcrm-web` → Coolify pulls and runs it. See [`docs/deployment.md`](docs/deployment.md).

Shared server/infrastructure standards live in [`u2giants/albert-standards`](https://github.com/u2giants/albert-standards/tree/main/infrastructure). When this app's deployment, domains, runtime ownership, server dependencies, or infrastructure incident runbooks change, update that repository too.

## Run

```bash
npm install
npm run dev
npm run build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. Optional `VITE_LOGODEV_TOKEN` enables domain-derived customer logos.
