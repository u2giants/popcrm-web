# AGENTS.md — popcrm-web

Canonical operating guide and documentation router for **popcrm-web**. Read this
first; load other docs only when the task needs them (see the Documentation map).

## Project summary

`popcrm-web` is the **POP CRM frontend** — a Vite/React/TypeScript single-page app
served by nginx, used by internal POP Creations staff to run customer, sales,
licensing and product-development workflows: customers, contacts, the program
pipeline, Outlook-ingested email routing, Fireflies meeting notes, notes, tasks,
licensor approvals, and AI-model settings.

It **stores no data of its own** — every read/write goes through the shared
Supabase project (`https://qsllyeztdwjgirsysgai.supabase.co`). The CRM backend is
a Supabase/Postgres port of the retired CRM data model. The
outcome that matters: a fast, dense operations console over that shared data.

- Production: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Backend (Supabase): `https://qsllyeztdwjgirsysgai.supabase.co`
- Fireflies webhook/health: `https://crm-fireflies.designflow.app`
- Sibling frontends (separate repos): `poppim-web` (PIM), `popdam-web` (DAM)

## AI tool notes

Claude Code uses .claudeignore. Other tools should skip 
ode_modules/, dist/, .env, and generated output.

## Documentation map: what to read for each task

Business logic is companywide and organized by topic, not by application. Start at
[companywide application and task map](https://github.com/u2giants/shared-db/blob/main/docs/business-rules/application-map.md)
and load only the topics the task touches. This repo documents CRM implementation; it must
not maintain a competing copy of a business rule.

Always start with:

- `AGENTS.md`

Then load additional docs only when relevant:

| Task / question | Read these docs | Usually do not need |
|---|---|---|
| Quick repo orientation | `README.md`, `AGENTS.md` | Deep docs under `docs/` |
| Modify app behavior or project-owned code | `AGENTS.md`, `docs/architecture.md` if data flow/shape changes | `docs/deployment.md` unless deploy behavior changes |
| Add/change config, env vars, or runtime settings | `AGENTS.md`, `docs/configuration.md`, `docs/deployment.md` if prod/runtime is affected | Unrelated architecture docs |
| Change local setup, dev/test/lint scripts, or tooling | `AGENTS.md`, `docs/development.md`, `package.json`, `eslint.config.js` | `docs/deployment.md` unless CI/CD changes |
| Change deployment, Docker, CI/CD, hosting, release, or rollback | `AGENTS.md`, `docs/deployment.md`, `.github/workflows/deploy.yml`, `Dockerfile`, `nginx.conf` | Local-only dev docs |
| Change data shape, Supabase fields, queries, views, RPCs, or identifiers | `AGENTS.md`, `docs/architecture.md`, `src/lib/types.ts`, `src/lib/database.types.ts`, `src/features/crm/api.ts`, canonical `/worksp/shared-db/supabase/migrations/` for backend changes | Deployment docs unless rollout changes |
| Investigate bugs or incidents | `AGENTS.md` (Critical incidents pointer), [`docs/critical-incidents.md`](docs/critical-incidents.md), [`docs/quirks.md`](docs/quirks.md) if behavior looks intentional-but-surprising, area-relevant source, `HANDOFF.md` if present | Unrelated docs |
| Continue unfinished work | `AGENTS.md`, `HANDOFF.md` (if present) and the docs it names | Docs outside the handoff scope |
| Surprising behavior / non-obvious rules | `AGENTS.md`, [`docs/quirks.md`](docs/quirks.md) | Full incident history |
| Claude Code session | `CLAUDE.md`, then `AGENTS.md` | Other docs unless the task requires them |
| Documentation-only cleanup | `AGENTS.md`, `README.md`, affected `docs/`, ignore files | Source files except to verify accuracy |
| Pull secrets from 1Password (MCP server or `op` CLI) | `AGENTS.md`, `docs/1password.md` | Unrelated architecture/deploy docs |

Notes:
- `HANDOFF.md` is **absent** when there is no unfinished work. If it exists, it is
  required reading for continuation tasks.
- Shared non-code infrastructure/server standards live in
  [`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure).
  When deployment, domains, runtime ownership, server dependencies, break-glass
  runbooks, or infrastructure decisions change for this app, update that repo too.

## Shared DB Gatekeeper

Repository-local task routing is declared in `.ai-devops/task-gates.json` and
verified by `scripts/test-task-gates.sh`. Protected authorization, worker,
deployment, and shared-database paths require their full declared treatment;
acknowledgement never bypasses a database-route refusal.

This repo shares the Supabase backend project `qsllyeztdwjgirsysgai` with the
other POP apps. All database/schema changes for that shared backend must be
authored in the canonical repo
[`u2giants/shared-db`](https://github.com/u2giants/shared-db) before any app code:
branch + PR + timestamped migration, preview-first, and the AI merges it.

Do not make app-side DDL, inline/startup migrations, Supabase dashboard SQL,
one-off `execute_sql`, or a local `supabase/migrations/` migration in this repo.
The only migration folder this repo may contain is the auto-synced, read-only
`shared-db/` vendor copy. The guard workflow
`.github/workflows/shared-db-guard.yml` runs on push and pull request; it fails
DB/schema changes outside `shared-db/` unless the owner-approved override is
present: PR label `db-change-approved` or `[db-change-approved]` in a commit
message.

### Shared query and search performance contract

The production AI-tagging timeout remediation is the shared reference for
large-list and search access paths. Read the auto-synced canonical note at
`shared-db/docs/app-migration-notes/ai-tagging-keyset-timeout-20260714.md`
before changing a high-volume CRM query. The DAM-only
`get_ai_tag_candidates(...)` RPC and its indexes are private worker
infrastructure; CRM must not call or copy them.

Continue using the existing bounded `api.crm_*_list`, recent-feed, segment-list,
and segment-count contracts. Audit customer/opportunity lists, email routing,
activity timelines, global search, and tab counts for deep offsets, exact counts
in the list hot path, broad browser reads, client-side aggregation, and
nonunique timestamp ordering. Prefer opaque keyset cursors with an ID
tie-breaker, keep counts optional and independently failure-tolerant, and prove
new query-shaped indexes with representative
`EXPLAIN (ANALYZE, BUFFERS)`. New views/RPCs/indexes belong in canonical
`shared-db` and go preview-first. CRM access to DAM search, when a product
workflow genuinely needs it, must use a purpose-specific authorized `api.*`
projection rather than DAM internals or a service-role credential.

## Shared-backend startup/shutdown hygiene

Why this exists:
`popcrm-web`, `poppim-web`, and `popdam3` all depend on the same Supabase backend.
An unfinished migration or dirty canonical `u2giants/shared-db` checkout can block
unrelated app commits or, worse, ship a database change without the right preview
checks. Future AI sessions must keep shared-db work isolated and leave the
workspace clean enough for the next vibe-coding session.

Startup checklist:

1. Run `git status --short` in this repo before editing.
2. If the task may touch Supabase schema, RLS, API views/RPCs, generated database
   types, or cross-app data contracts, also run `git status --short` in
   `/worksp/shared-db` before editing.
3. Treat `shared-db/` inside this repo as a read-only mirror. Do not create or
   edit migrations there; use canonical `/worksp/shared-db`.
4. If `/worksp/shared-db` has untracked migrations or unrelated dirty files, stop
   and report them before creating new database work. Do not mix another
   session's shared-db changes into this app's commit.
5. Before creating a shared-db migration, create/switch to a dedicated
   `/worksp/shared-db` branch named for the database change. App repos commit to
   `main`; shared-db uses branch + PR.

Shutdown checklist:

1. Run `git status --short` in this repo and, if touched or inspected for backend
   work, in `/worksp/shared-db`.
2. No untracked shared-db migration may remain. Every shared-db migration must be
   committed on its own branch, stashed with a clear name, or removed if
   abandoned.
3. If shared-db work is incomplete, leave durable handoff text that names the
   branch/stash, migration file, preview/prod apply status, and the next exact
   action.
4. Final reports must separate app commits from shared-db status so the owner can
   keep vibe-coding without becoming the git janitor.

## Repository structure

Project-owned application code:

- `src/app/` — shell + router: `AppLayout.tsx`, `routes.tsx`, `navigation.ts`
- `src/components/app/` — shared building blocks: `DataTable`, `DetailDrawer`,
  `MetricCard`, `PageToolbar`, `AppPage`, `AppSidebar`, `AppHeader`, `Combobox`,
  `CommandSearch`, `FilterSelect`, `StatusBadge`, `states.tsx`
- `src/features/crm/` — CRM domain:
  - `CrmDataContext.tsx` — loads all collections once; exposes state, refresh, stats
  - `api.ts` — Supabase view/RPC/table reads and writes · `constants.ts` · `format.ts` · `useRecordSelection.ts`
  - `pages/` — one module per route (Overview, Pipeline, Customers, Contacts,
    EmailRouting, Meetings, Notes, Tasks, Approvals, Settings) + `_shared.ts`
  - `components/` — domain drawers (Email/Opportunity/Customer/Contact/Task/Note/
    Meeting/Approval) + `CrmStatusBadge`, `RelationLabel`
- `src/auth/auth.tsx` — Supabase auth/profile state · `src/pages/LoginPage.tsx`
- `src/lib/` — `supabase.ts` (client), `database.types.ts` (generated schema), `types.ts` (frontend domain types), `utils.ts`
- `src/App.tsx`, `src/main.tsx`, `src/index.css` (shared OKLCH design tokens)

Generated-style primitives (shadcn): `src/components/ui/*` — see Core modification inventory.

Build / config / deploy:

- `Dockerfile`, `nginx.conf`, `.github/workflows/deploy.yml`
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `package.json`

Docs: `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/*`

Build artifacts / ignored: `dist/`, `node_modules/` (see What to ignore).

Shared Supabase migrations live in the canonical `/worksp/shared-db` repo. This
repo's `shared-db/` folder is a read-only vendor copy.

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
| `Dockerfile` | Added `COMMIT_HASH` / `COMMIT_DATE` / `VITE_LOGODEV_TOKEN` build args before `npm run build` | `.git` is dockerignored (commit identity passed by CI); `VITE_*` is build-time so the logo.dev token must be baked at build | If the header build-stamp is removed, drop the commit args too; `VITE_LOGODEV_TOKEN` is optional (empty → initials avatars) |

No third-party/vendor/framework source files are modified. `src/components/ui` is
the only "generated-style" area, and it is hand-maintained in this repo.

## Task-to-file navigation: what to edit for common changes

| Task | Files to touch | Files not to touch |
|---|---|---|
| Change a CRM page/table/filter | `src/features/crm/pages/<Page>.tsx` | `src/components/ui/*` |
| Change a record drawer | `src/features/crm/components/<X>Drawer.tsx` | unrelated pages |
| Add/adjust a Supabase query, field, view, or RPC | `src/features/crm/api.ts`, `src/lib/types.ts`, `src/lib/database.types.ts`; canonical `/worksp/shared-db/supabase/migrations/` for backend changes | retired backend schemas |
| Add a route / nav item | `src/app/routes.tsx`, `src/app/navigation.ts` | shell internals unless needed |
| Change status colors / stage tones | `src/features/crm/constants.ts`, `src/index.css` (tokens) | per-component ad-hoc colors |
| Add a shared UI building block | `src/components/app/` | `src/components/ui/*` (primitives only) |
| Change a base primitive | `src/components/ui/<name>.tsx` | — (note in Core modification inventory) |
| Change build/deploy | `.github/workflows/deploy.yml`, `Dockerfile`, `nginx.conf` | the production server directly |
| Add an env/config value | `src/lib/supabase.ts`, `docs/configuration.md`; CI build args for `VITE_*` | a real `.env` in the repo |
| Change admin impersonation ("view as") | `src/auth/auth.tsx` (identity overlay), `src/components/app/ImpersonationDialog.tsx` (user picker), `src/components/app/ImpersonationBar.tsx` (orange bar), `src/components/app/AppHeader.tsx` (menu item); the `api.crm_admin_user_list()` RPC lives in canonical `/worksp/shared-db` | per-user server-side data filters (there are none — see Quirks) |

## Data model and external identifiers

Supabase CRM entities this app reads/writes. Browser reads generally go through
`api.crm_*` views; guarded core writes use `api.crm_update_*` RPCs; CRM-owned row
writes use `crm.*` tables. Frontend domain types are in `src/lib/types.ts`;
generated database types are in `src/lib/database.types.ts`:

| Entity/System | Identifier | Where defined | Notes |
|---|---|---|---|
| Customer | `core.customer` / `api.customer_list` (shared) plus CRM-specific `api.crm_customer_*` contracts | Supabase | shared customer hub. `is_potential = true` means the hub tracks the company as a prospect; `false` only means it is not flagged as one — **not** that the company is a confirmed customer. `customer_status` is the CRM classification axis and the only field that says whether a company is a customer POP works (business rule: shared-db `docs/business-rules/customers-contacts-and-organizations.md`). Use `api.crm_customer_segment_list` / `api.crm_customer_segment_counts` for CRM customer page tabs and active pickers. Legacy `api.crm_account_list` / `api.crm_update_account` names are deprecated compatibility contracts only; do not add new callers. `api.crm_customer_list.logo_url` exposes PLM-imported full-width logo URLs when available |
| Ingested domain | `crm.ingested_domain` / `api.crm_ingested_domain_list` | Supabase | CRM-only email-domain triage inbox. These rows are **not** customers, are not shared with PM/DAM/PLM, and can **never** be promoted into `core.customer` (promotion dropped by shared-db `20260629034600`) |
| Contact | `core.contact` + `core.contact_company` / `api.crm_contact_list` | Supabase | contacts and customer/department relation rows migrated from the retired CRM stack |
| Department | `crm.department` / `api.crm_department_list` | Supabase | retailer departments |
| Opportunity | `crm.opportunity` / `api.crm_opportunity_list` | Supabase | pipeline; `stage` enum in `constants.ts:OPPORTUNITY_STAGES` |
| Email | `crm.email_message` / `api.crm_email_routing_recent` / `api.crm_email_routing_segment_counts` plus `api.crm_email_routing_queue` for small searches | Supabase | Outlook-ingested; `routing_status` drives routing UI. Do not page the entire joined queue view in the browser; use the recent feed and count RPCs to avoid PostgREST timeouts |
| Meeting note | `crm.meeting_note` / `api.crm_meeting_list` | Supabase | Fireflies/imported |
| Note / Task | `crm.note` / `crm.task` | Supabase | manual CRM records |
| Ignore rule | `crm.ignore_rule` / `api.crm_ignore_rule_list` | Supabase | email routing skip rules |
| AI model config | `crm.ai_model_config` / `api.crm_ai_model_config_list` | Supabase | model choices for routing/summaries |
| Licensor approval | `crm.licensor_approval_thread` / `api.crm_approval_queue` | Supabase | fields include `name, property_name, stage, submitted_date, response_date, due_date, licensor_comments, opportunity_id`. `stage` is **free-form** (no enum) — see Quirks |

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
| POP CRM host workers | Outlook ingest, reroute, contact sync, summaries, ignore rules | host systemd | `systemd/popcrm-*` | `workers/crm-worker-supabase.mjs` |
| Supabase | Backend API/Postgres (`qsllyeztdwjgirsysgai.supabase.co`) | Supabase | project `qsllyeztdwjgirsysgai` | shared database |
| popcrm-fireflies | Fireflies webhook/health worker | host Docker on `coolify` network | — | `workers/crm-worker-supabase.mjs` |
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

These align with `.claudeignore` and `.cursorignore`.

## Intentional quirks and non-obvious decisions

Full text lives in [docs/quirks.md](docs/quirks.md). Load it when a screen, filter, status label, worker, or import path behaves surprisingly. Do not re-derive those rules from code alone.

## Credentials and environment

No secret values appear here or in the repo.

| Variable | Purpose | Stored where | Required in dev | Required in prod |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (build-time) | `.env` (dev); CI build arg/secret in prod | yes | yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key (build-time) | `.env` (dev); CI build arg/secret in prod | yes | yes |
| `VITE_LOGODEV_TOKEN` | logo.dev **publishable** token (client-safe) for domain-derived customer logos | optional `.env` (dev); GitHub Actions secret `LOGODEV_TOKEN` → Docker build-arg (prod) | no (falls back to initials) | no (falls back to initials) |
| `COOLIFY_BASE_URL` | Coolify deploy API base for CI | GitHub Actions secret | n/a | n/a (CI only) |
| `COOLIFY_API_TOKEN` | Token to trigger Coolify deploy | GitHub Actions secret | n/a | n/a (CI only) |
| `COOLIFY_SERVER_UUID` | Coolify **application** uuid to deploy | GitHub Actions secret | n/a | n/a (CI only) |
| `LOGODEV_TOKEN` | logo.dev publishable token → `VITE_LOGODEV_TOKEN` build-arg | GitHub Actions secret (optional) | n/a | n/a (CI only) |
| `GITHUB_TOKEN` | GHCR push (built-in) | GitHub Actions (auto) | n/a | n/a (CI only) |

Runtime auth is Supabase Auth (Azure OAuth/password). The SPA holds only the
public Supabase URL/anon key and the optional publishable logo.dev key; never put
service-role keys or real `.env` files in this repo.

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

Full text lives in [docs/critical-incidents.md](docs/critical-incidents.md). Load it when investigating a regression, blank page, deploy failure, or data-access gate.

## Pending work

| Status | Item | Owner/next action |
|---|---|---|
| blocked | Customer logos go live | Code deployed but inert until `LOGODEV_TOKEN` GitHub secret is set (publishable logo.dev key) — see HANDOFF.md. Falls back to initials until then |
| open | Server-side pagination / Supabase aggregates | Currently client-side for CRM screens; revisit if record volumes grow |
| open | Bump CI actions off Node 20 | GitHub deprecates Node-20 actions (~2026-06-16); update `actions/*` and `docker/*` versions in `deploy.yml` |
| known | Lint baseline | **Zero.** `npm run lint` reports no errors and no warnings as of 2026-08-13; the last one (`set-state-in-effect` in the auth gate) was removed in Session 12. There is no accepted-warning list any more — do not reintroduce one, and do not merge a warning. |
| unknown | `crm_licensor_approval_thread.stage` values | Free-form, 0 rows today; verify real values via backend when approval data exists |
<!-- ansible-host-policy: managed rollout from u2giants/ansible -->
## Host / server changes — do NOT make them here

This repo is the app layer. The `hetz` server's host/OS layer is owned by
**Ansible** in `/worksp/ansible` / **[`u2giants/ansible`](https://github.com/u2giants/ansible)**.
Host changes include packages, users, firewall, SSH/sudo, Docker engine/daemon
config, systemd units/timers, cron, `/etc`, `/usr/local/bin` or
`/usr/local/sbin`, Cloudflare Tunnel 1, Coolify host glue, and backup/DNS
watchdogs.

Do not SSH, sudo, or hand-edit the host for durable infra changes. Make a PR in
`/worksp/ansible` and let GitHub Actions apply it. Break-glass direct host repair
must be explicit, temporary, and followed by an Ansible PR that captures or
reconciles the drift. See
[`u2giants/ansible/AGENTS.md`](https://github.com/u2giants/ansible/blob/main/AGENTS.md).

App code/config that belongs to `popcrm-web` still changes here and deploys
through the normal GitHub Actions -> Coolify pipeline. Scope boundary:
**Ansible owns the host; Coolify owns the apps.**
