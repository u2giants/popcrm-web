# AGENTS.md — popcrm-web

Canonical operating guide and documentation router for **popcrm-web**. Read this
first; load other docs only when the task needs them (see the Documentation map).

## Project summary

`popcrm-web` is the **POP CRM frontend** — a Vite/React/TypeScript single-page app
served by nginx, used by internal POP Creations staff to run customer, sales,
licensing and product-development workflows: accounts, contacts, the program
pipeline, Outlook-ingested email routing, Fireflies meeting notes, notes, tasks,
licensor approvals, and AI-model settings.

It **stores no data of its own** — every read/write goes through the shared
Directus API at `https://data.designflow.app`. The CRM backend is custom (a
Twenty→Directus migration), **not** the Directus Simple CRM template. The outcome
that matters: a fast, dense operations console over that Directus data.

- Production: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Backend (Directus API): `https://data.designflow.app`
- Fireflies webhook/health: `https://crm-fireflies.designflow.app`
- Sibling frontends (separate repos): `poppim-web` (PIM), `popdam-web` (DAM)

## Multi-model AI note

There is no universal ignore-file standard across AI coding tools.

`.claudeignore` works for Claude Code.

When using any other AI tool, paste this file as your first message and follow the instructions in the "What to ignore" section.

## Documentation map: what to read for each task

Always start with:

- `AGENTS.md`

Then load additional docs only when relevant:

| Task / question | Read these docs | Usually do not need |
|---|---|---|
| Quick repo orientation | `README.md`, `AGENTS.md` | Deep docs under `docs/`, `frontend_imp.md` |
| Modify app behavior or project-owned code | `AGENTS.md`, `docs/architecture.md` if data flow/shape changes | `docs/deployment.md` unless deploy behavior changes |
| Add/change config, env vars, or runtime settings | `AGENTS.md`, `docs/configuration.md`, `docs/deployment.md` if prod/runtime is affected | Unrelated architecture docs |
| Change local setup, dev/test/lint scripts, or tooling | `AGENTS.md`, `docs/development.md`, `package.json`, `eslint.config.js` | `docs/deployment.md` unless CI/CD changes |
| Change deployment, Docker, CI/CD, hosting, release, or rollback | `AGENTS.md`, `docs/deployment.md`, `.github/workflows/deploy.yml`, `Dockerfile`, `nginx.conf` | Local-only dev docs |
| Change data shape, Directus fields, queries, or identifiers | `AGENTS.md`, `docs/architecture.md`, `src/lib/types.ts`, `src/features/crm/api.ts` | Deployment docs unless rollout changes |
| Investigate bugs or incidents | `AGENTS.md` (Critical incidents), area-relevant source, `HANDOFF.md` if present | Unrelated docs |
| Continue unfinished work | `AGENTS.md`, `HANDOFF.md` (if present) and the docs it names | Docs outside the handoff scope |
| Understand the redesign rationale (charts, tokens, layout) | `frontend_imp.md` (historical plan — fully implemented) | Everything else |
| Claude Code session | `CLAUDE.md`, then `AGENTS.md` | Other docs unless the task requires them |
| Documentation-only cleanup | `AGENTS.md`, `README.md`, affected `docs/`, ignore files | Source files except to verify accuracy |

Notes:
- `HANDOFF.md` is **absent** when there is no unfinished work. If it exists, it is
  required reading for continuation tasks.
- `frontend_imp.md` is a large background design plan — now fully implemented. It is in
  `.claudeignore`/`.cursorignore` to keep it out of routine AI context.
- `design_handoff_popcrm_elevation/` is a historical design-spec directory — also ignored.

## Repository structure

Project-owned application code:

- `src/app/` — shell + router: `AppLayout.tsx`, `routes.tsx`, `navigation.ts`
- `src/components/app/` — shared building blocks: `DataTable`, `DetailDrawer`,
  `MetricCard`, `PageToolbar`, `AppPage`, `AppSidebar`, `AppHeader`, `Combobox`,
  `CommandSearch`, `FilterSelect`, `StatusBadge`, `states.tsx`
- `src/features/crm/` — CRM domain:
  - `CrmDataContext.tsx` — loads all collections once; exposes state, refresh, stats
  - `api.ts` — Directus SDK reads/writes · `constants.ts` · `format.ts` · `useRecordSelection.ts`
  - `pages/` — one module per route (Overview, Pipeline, Accounts, Contacts,
    EmailRouting, Meetings, Notes, Tasks, Approvals, Settings) + `_shared.ts`
  - `components/` — domain drawers (Email/Opportunity/Account/Contact/Task/Note/
    Meeting/Approval) + `CrmStatusBadge`, `RelationLabel`
- `src/auth/auth.tsx` — Directus session auth · `src/pages/LoginPage.tsx`
- `src/lib/` — `directus.ts` (client), `types.ts` (Directus schema slice), `utils.ts`
- `src/App.tsx`, `src/main.tsx`, `src/index.css` (shared OKLCH design tokens)

Generated-style primitives (shadcn): `src/components/ui/*` — see Core modification inventory.

Build / config / deploy:

- `Dockerfile`, `nginx.conf`, `.github/workflows/deploy.yml`
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `package.json`

Docs: `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/*`, `frontend_imp.md`

Build artifacts / ignored: `dist/`, `node_modules/` (see What to ignore).

There are no migrations or DB files in this repo — schema lives in the backend repo
`u2giants/directus` (`/worksp/directus/pm-system/crm-schema.mjs`).

## Prime Directive: custom-code boundary

Our custom code lives here:

- `src/app/`
- `src/components/app/`
- `src/features/`
- `src/auth/`, `src/pages/`, `src/lib/`
- `docs/`
- `.github/workflows/`
- root config: `Dockerfile`, `nginx.conf`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`

Everything else requires justification before touching. In particular,
`src/components/ui/*` are shadcn-style primitives (see below).

## Core modification inventory

Files modified outside the clearly project-owned application areas:

| File | Change made | Why it was necessary | Risk during upgrades |
|---|---|---|---|
| `src/components/ui/*.tsx` | Hand-authored shadcn-style primitives (tabs, select, table, tooltip, popover, dialog, label, chart, etc.) using the unified `radix-ui` import style | shadcn CLI/registry not run here; primitives added to match existing ones | Running `npx shadcn add` could overwrite/conflict; keep the `radix-ui` (not `@radix-ui/*`) import style and Lucide icons |
| `Dockerfile` | Added `COMMIT_HASH` / `COMMIT_DATE` build args before `npm run build` | `.git` is dockerignored, so CI passes commit identity for the in-app build stamp | If the header build-stamp is removed, drop the args too |

No third-party/vendor/framework source files are modified. `src/components/ui` is
the only "generated-style" area, and it is hand-maintained in this repo.

## Task-to-file navigation: what to edit for common changes

| Task | Files to touch | Files not to touch |
|---|---|---|
| Change a CRM page/table/filter | `src/features/crm/pages/<Page>.tsx` | `src/components/ui/*` |
| Change a record drawer | `src/features/crm/components/<X>Drawer.tsx` | unrelated pages |
| Add/adjust a Directus query or field | `src/features/crm/api.ts`, `src/lib/types.ts` | applied backend schema (in `u2giants/directus`) |
| Add a route / nav item | `src/app/routes.tsx`, `src/app/navigation.ts` | shell internals unless needed |
| Change status colors / stage tones | `src/features/crm/constants.ts`, `src/index.css` (tokens) | per-component ad-hoc colors |
| Add a shared UI building block | `src/components/app/` | `src/components/ui/*` (primitives only) |
| Change a base primitive | `src/components/ui/<name>.tsx` | — (note in Core modification inventory) |
| Change build/deploy | `.github/workflows/deploy.yml`, `Dockerfile`, `nginx.conf` | the production server directly |
| Add an env/config value | `src/lib/directus.ts`, `docs/configuration.md`; Coolify for runtime | a real `.env` in the repo |

## Data model and external identifiers

Directus collections this app reads/writes (entities). All live in the backend, at
`https://data.designflow.app`; typed in `src/lib/types.ts`:

| Entity/System | Identifier | Where defined | Notes |
|---|---|---|---|
| Account | `retailer` | Directus | companies/accounts (migrated from Twenty `company`) |
| Contact | `buyer` | Directus | contacts (migrated from Twenty `person`) |
| Department | `crm_department` | Directus | retailer departments |
| Opportunity | `crm_opportunity` | Directus | pipeline; `stage` enum in `constants.ts:OPPORTUNITY_STAGES` |
| Email | `crm_email_message` | Directus | Outlook-ingested; `routing_status` drives routing UI |
| Meeting note | `crm_meeting_note` | Directus | Fireflies/imported |
| Note / Task | `crm_note` / `crm_task` | Directus | manual CRM records |
| Ignore rule | `crm_ignore_rule` | Directus | email routing skip rules |
| AI model config | `crm_ai_model_config` | Directus | model choices for routing/summaries |
| Licensor approval | `crm_licensor_approval_thread` | Directus | fields: `name, property_name, stage, submitted_date, response_date, due_date, licensor_comments, opportunity`. `stage` is **free-form** (no enum) — see Quirks |

Deployment / external identifiers (not secrets):

| System | Identifier | Where defined | Notes |
|---|---|---|---|
| Coolify app | `a1vb55by4benmh25nd4ga8pt` | Coolify | production deploy target for this app |
| Coolify project | `yp84tp0tmmshhcebgsd4j463` ("POP Creations CRM") | Coolify | env `production` |
| Coolify server | `onwp0kd7w1w74w9yeotnoihp` (localhost) | Coolify | runtime host |
| Coolify instance | `https://coolify.designflow.app` | Coolify | deploy API base |
| Registry image | `ghcr.io/u2giants/popcrm-web` | GHCR | public package; tags `latest`, `main`, `sha-<sha>` |
| Production domains | `crm.designflow.app`, `crm-dev.designflow.app` | Coolify (app fqdn) | — |

Do not casually rename, regenerate, or replace these identifiers.

## Container and service inventory

This repo owns exactly one runtime container (the rest are external dependencies on
this same host, owned by other repos/systems — listed for context):

| Container/service | Purpose | Managed by | App/project ID | Image/source |
|---|---|---|---|---|
| `popcrm-web` (this app) | Frontend SPA via nginx | Coolify | app `a1vb55by4benmh25nd4ga8pt` | `ghcr.io/u2giants/popcrm-web` |
| Directus | Backend API (`data.designflow.app`) | Coolify (repo `u2giants/directus`) | — | `directus/directus:11` |
| popcrm-fireflies | Fireflies webhook/health worker | external | — | from `u2giants/directus` pm-system |
| coolify-proxy | Traefik reverse proxy / TLS | Coolify | — | `traefik:v3.6` |

The running container name is Coolify-generated as `<app-uuid>-<deploy-id>` and
**changes on every deploy**; the stable identifier is the app uuid above.

## What to ignore

Do not load these into AI context unless explicitly needed:

- `node_modules/`
- `dist/`
- `.env`, `*.local`
- `.cache/`, `coverage/`
- Leftover Vite-template assets (unused): `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`
- `design_handoff_popcrm_elevation/` — historical design spec directory (fully implemented)
- `frontend_imp.md` — historical design plan (fully implemented)

These align with `.claudeignore` and `.cursorignore`.

## Intentional quirks and non-obvious decisions

### Bootstrap loader tolerates a failing collection

Looks like:
`CrmDataContext.load()` uses `Promise.allSettled` and per-collection setters instead of one `Promise.all`.

Actually:
Each Directus collection loads independently; a failing one leaves its section empty and a hard error shows only if everything fails.

Why:
A single 403 (e.g. a Directus permission/schema gap on one collection) previously blanked the entire app. See Critical incidents 2026-06-12.

Do not change because:
Reverting to all-or-nothing makes one bad collection take down every page.

### Commit stamp comes from build args, not git, in CI

Looks like:
`vite.config.ts` reads `process.env.COMMIT_HASH` / `COMMIT_DATE` before falling back to `git`.

Actually:
The Docker build context excludes `.git` (`.dockerignore`), so git is unavailable inside the image build; CI passes the values as Docker build args.

Why:
The app header shows the deployed commit + NYC time; without build args the stamp would be empty in CI builds.

Do not change because:
Removing the env path silently blanks the build stamp in production.

### `crm_licensor_approval_thread.stage` is free-form

Looks like:
There's no `APPROVAL_STATUSES` enum; tone/labels are keyword-matched (`approvalTone`, `isApprovalResolved` in `constants.ts`).

Actually:
The Directus `stage` field has no fixed choices, and the collection currently has 0 rows.

Why:
The real schema differs from earlier assumptions; matching keywords is robust to unknown values.

Do not change because:
Hard-coding an enum would re-introduce the wrong field/value assumptions that caused the 2026-06-12 incident. Verify real values via the backend once approval data exists.

### `src/components/ui` is hand-maintained, imports from `radix-ui`

Looks like:
Standard shadcn output you could regenerate with the CLI.

Actually:
Primitives are hand-authored here and import from the unified `radix-ui` package (e.g. `import { Dialog } from "radix-ui"`), not `@radix-ui/react-*`.

Why:
Matches the existing primitives and the installed dependency set.

Do not change because:
Running `npx shadcn add` may rewrite these with a different import style and break the build.

### `VITE_*` is build-time, not runtime

See Credentials and environment / `docs/deployment.md` — a static SPA bakes config at build, so there is no Coolify runtime env for app config.

## Credentials and environment

No secret values appear here or in the repo.

| Variable | Purpose | Stored where | Required in dev | Required in prod |
|---|---|---|---|---|
| `VITE_DIRECTUS_URL` | Directus API base URL (build-time) | optional `.env` (dev); defaults to `https://data.designflow.app` | no (defaults) | no (defaults) |
| `COOLIFY_BASE_URL` | Coolify deploy API base for CI | GitHub Actions secret | n/a | n/a (CI only) |
| `COOLIFY_API_TOKEN` | Token to trigger Coolify deploy | GitHub Actions secret | n/a | n/a (CI only) |
| `COOLIFY_SERVER_UUID` | Coolify **application** uuid to deploy | GitHub Actions secret | n/a | n/a (CI only) |
| `GITHUB_TOKEN` | GHCR push (built-in) | GitHub Actions (auto) | n/a | n/a (CI only) |

Runtime auth is a Directus httpOnly session cookie scoped to `.designflow.app`
(set by the backend), so the SPA holds no app secrets. Never commit a real `.env`.

## Deployment

Single orchestrated workflow: push to `main` → GitHub Actions builds, publishes,
and triggers Coolify. CI never SSHes into or mutates the server. Full detail in
`docs/deployment.md`; summary:

- Workflow: `.github/workflows/deploy.yml` (name: **Build and Deploy**), jobs
  `verify` → `build-and-push` → `deploy`.
- Image/package: `ghcr.io/u2giants/popcrm-web`; tags `latest`, `main`, `sha-<commit-sha>`.
- Platform/app: Coolify app `popcrm-web` (`a1vb55by4benmh25nd4ga8pt`), project
  "POP Creations CRM" (`yp84tp0tmmshhcebgsd4j463`), env `production`.
- Deploy trigger: GitHub Actions `POST {COOLIFY_BASE_URL}/api/v1/deploy?uuid=<app>` (bearer token).
- Rollback: in Coolify, redeploy a previous `sha-<sha>` image (immutable tag).
- Runtime env: owned by Coolify (domains/ports/health/restart). App config is
  build-time `VITE_*` (static SPA), not Coolify runtime env.
- **SSH is not the normal path.** Manual `docker run` on the host is emergency/
  break-glass only; restore the Coolify-managed deploy immediately afterward.
- Branching: single-branch model — commit to `main`; do not create feature
  branches for this repo. Documentation / AI-context-only changes (`docs/**`,
  `**/*.md`, `.claudeignore`, `.cursorignore`, `.copilotignore`) skip the build.

## Critical incidents

### 2026-06-12 Every page blank — approvals schema mismatch + all-or-nothing loader

What happened:
After the redesign deploy, every page showed "Something went wrong / data could not be loaded."

Impact:
The whole CRM UI was unusable while signed in (no page rendered data).

Root cause:
`fetchApprovalThreads` requested `crm_licensor_approval_thread` fields that don't
exist in Directus (`licensor_name`, `approval_status`, `submitted_at`, `approved_at`,
`latest_comment`). Directus returned 403 for the unknown fields. The loader used
`Promise.all`, so that single rejection failed the entire bootstrap and blanked all pages.

Recovery:
Two commits: `29ea195` switched the loader to `Promise.allSettled` (resilience);
`3592b88` mapped approvals to the real fields (`property_name`, `stage`,
`submitted_date`, `response_date`, `due_date`, `licensor_comments`). Verified the
corrected query returns 200 and the live site loads.

Rule added to prevent recurrence:
Never load all collections all-or-nothing; verify requested fields against the real
Directus schema (`information_schema.columns`) before relying on them.

### 2026-06-11 Migration: raw `docker run` → Coolify-managed deploy

What happened:
The app was running as a hand-labeled raw `docker run` container with no CI; it was
migrated to the compliant GitHub Actions → GHCR → Coolify pipeline and cut over.

Impact:
Brief, controlled cutover of `crm.designflow.app` (domains moved to the Coolify app,
old container removed). No data at risk (frontend stores none).

Root cause:
N/A (planned migration to meet the CI/CD operating rules).

Recovery:
N/A — verified live on the new pipeline; old container removed (image kept locally as a temporary artifact).

Rule added to prevent recurrence:
Production deploys go through the workflow only; the old raw-container runbook is
now break-glass only (see `docs/deployment.md`).

## Pending work

| Status | Item | Owner/next action |
|---|---|---|
| done | Redesign, CI/CD pipeline, Coolify cutover, data-load fixes | Completed in commits up to `3592b88` |
| done | Full UI redesign: all pages, drawers, charts, tokens, board/list toggles | All screens complete; `frontend_imp.md` fully implemented |
| done | Tasks board view | Kanban columns (TODO/In progress/Done/Blocked) with TaskCard, drag-to-status via chip |
| done | Pipeline list/board toggle | DataTable list view + existing board; segmented control in ListBar |
| done | OpportunityModal: Ask AI, Share, Expand/collapse | All three top-bar actions wired; composer calls `createNote` API |
| done | `label()` enum overrides | `AI`, `DETERMINISTIC`, `IN_PROGRESS`, `TODO`, routing statuses all map to readable labels |
| done | Email routing: Method column | Replaced Department column; `MethodChip` + `MethodConfidence` in drawer |
| done | Overview activity panels | Reduced to 2 (Meetings + Approvals); deep-links via `useRecordSelection` |
| done | Approvals columns | Name · Licensor · Status · Submitted · Program · Latest comment per spec |
| done | All record drawers polished | Meeting/Task/Email/Note/Approval drawers match spec |
| open | Server-side pagination / Directus aggregates | Currently client-side; revisit if record volumes grow |
| open | Bump CI actions off Node 20 | GitHub deprecates Node-20 actions (~2026-06-16); update `actions/*` and `docker/*` versions in `deploy.yml` |
| known | Pre-existing lint warnings in `src/auth/auth.tsx` | 3 warnings (`any`, setState-in-effect, unused disable) accepted; do not add new warnings elsewhere |
| unknown | `crm_licensor_approval_thread.stage` values | Free-form, 0 rows today; verify real values via backend when approval data exists |
