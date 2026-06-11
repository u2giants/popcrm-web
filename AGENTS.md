# AGENTS.md — popcrm-web

Canonical operating guide for **popcrm-web**, the POP CRM frontend.

## Project Summary

`popcrm-web` is the CRM frontend for POP Creations. It is a React single-page app served by nginx and backed by the shared Directus API at `https://data.designflow.app`.

Users are internal POP staff working with accounts, contacts, opportunities, Outlook-ingested email, Fireflies meeting notes, routing rules, AI model settings, notes, tasks, and licensor approvals.

This app stores no data of its own. All reads and writes go through Directus.

Live URLs:

- Production: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Backend Data Studio/API: `https://data.designflow.app`
- Fireflies health/webhook service: `https://crm-fireflies.designflow.app`

Sibling frontends:

- `poppim-web`: PIM/project-management frontend.
- `popdam-web`: DAM frontend.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-style/Radix UI primitives in `src/components/ui`
- Directus SDK
- Lucide icons
- Sonner toasts

## Important Files

| Path | Purpose |
|---|---|
| `src/App.tsx` | Auth gate and shell wrapper |
| `src/auth/auth.tsx` | Directus session auth |
| `src/components/AppShell.tsx` | Authenticated app shell |
| `src/components/ui/` | shadcn-style generated primitives |
| `src/features/crm/CrmPage.tsx` | Current CRM workbench |
| `src/features/crm/api.ts` | Directus SDK reads/writes |
| `src/lib/directus.ts` | Directus client config |
| `src/lib/types.ts` | Frontend TypeScript slice of Directus schema |
| `src/pages/LoginPage.tsx` | Login screen |
| `frontend_imp.md` | Comprehensive frontend redesign plan using Tailwind Plus Application UI and Tremor |

## Backend Context

The CRM backend is custom. It is not Directus's Simple CRM template.

Backend repo:

- GitHub: `https://github.com/u2giants/directus`
- Local path: `/worksp/directus`

Relevant backend files:

- `/worksp/directus/pm-system/crm-schema.mjs`
- `/worksp/directus/pm-system/migration/twenty-import.mjs`
- `/worksp/directus/pm-system/crm-worker.mjs`
- `/worksp/directus/pm-system/systemd/*`

ClickUp sync is intentionally omitted for CRM.

## Data Model Used By This App

Core Directus collections:

- `retailer`
- `buyer`
- `crm_department`
- `crm_opportunity`
- `crm_email_message`
- `crm_meeting_note`
- `crm_ignore_rule`
- `crm_ai_model_config`
- `crm_note`
- `crm_task`
- `crm_licensor_approval_thread`

## Naming

The correct project name is **popcrm-web**. Repo, package, image, and container names should all use this spelling.

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

`VITE_DIRECTUS_URL` is optional and defaults to `https://data.designflow.app`.

Do not commit real `.env` values.

## Deployment

Current production deployment is raw Docker attached to the existing Coolify proxy network.

Canonical image/container name:

- Image: `popcrm-web:latest`
- Container: `popcrm-web`

Canonical host rules:

- `crm.designflow.app`
- `crm-dev.designflow.app`

See `docs/deployment.md` for the exact command.

## Generated Code Boundary

`src/components/ui/*` are shadcn-style primitives. Prefer adding/updating these through the shadcn workflow rather than hand-editing primitives.

Owned app code lives in:

- `src/features/`
- `src/auth/`
- `src/pages/`
- `src/components/AppShell.tsx`
- `src/lib/`
- `docs/`
- root docs such as `README.md`, `AGENTS.md`, `frontend_imp.md`

## What To Ignore

Do not load these into AI context unless explicitly needed:

- `node_modules/`
- `dist/`
- `.env`
- `*.local`
- `.cache/`
- `coverage/`
- stale Vite assets in `src/assets/` and `public/icons.svg`

## Current Frontend Redesign Direction

The user purchased Tailwind Plus Application UI. The plan is to redesign this CRM in-place using:

- Tailwind Plus Application UI for app shell, tables, drawers, forms, settings, empty states.
- Tremor for dashboard metrics and charts.
- Existing Directus SDK/custom CRM API underneath.

Read `frontend_imp.md` before starting frontend redesign work.
