# AGENTS.md — popcrm-web

The complete document index is [`docs/INDEX.md`](docs/INDEX.md), generated from document headers. Read it (or search it for your topic's keywords) before opening or searching any other document. Open a document only when its summary matches your task.

This file is a router: it routes, it does not contain. Detail moved out of here lives in [`docs/agents-reference.md`](docs/agents-reference.md) (same section names — nothing was dropped). `shared-db/` is an auto-synced, read-only copy of the canonical `u2giants/shared-db` repository; never edit it here.

## Standing rules (never skip)

- **Single-branch model:** commit directly to `main`; no feature branches. Documentation / AI-context-only changes (`docs/**`, `**/*.md`, `.claudeignore`, `.cursorignore`, `.copilotignore`) skip the build. Never push a `main` that fails `npm run lint` or `npm test`.
- **Every database/schema change starts in canonical [`u2giants/shared-db`](https://github.com/u2giants/shared-db)** (branch + PR + timestamped migration, preview-first, the AI merges it). No app-side DDL, dashboard SQL, or local migrations here. Full gatekeeper rules and query-performance contract: [`docs/agents-reference.md`](docs/agents-reference.md).
- **The `hetz` host/OS layer is owned by Ansible** ([`u2giants/ansible`](https://github.com/u2giants/ansible)); app layer only here. Scope: Ansible owns the host, Coolify owns the apps.
- **No secrets in this repo.** Values live in 1Password vault `vibe_coding` ([`docs/1password.md`](docs/1password.md)) or CI secrets; never in chat, files, or commits.
- **Commit identity:** `Albert Hazan <u2giants@users.noreply.github.com>` (check `git var GIT_COMMITTER_IDENT` before the first commit in a checkout).
- **Lint baseline is zero** — no errors, no warnings. Do not merge a warning and do not reintroduce an accepted-warning list.
- **Every new Markdown file opens with the four-key header** (`summary`, `kind`, `status`, `read-when`), then regenerate the index: `python3 <ai-devops-clone>/bin/ai-doc-health --repo . --fix-index` (tool: `popcre/ai-devops`, rules: its `docs/doc-health.md`). Never hand-edit `docs/INDEX.md`. The `Documentation health` workflow is advisory — never a required check.
- **Handoffs:** one write-once file per session under `HANDOFF.d/`; never rewrite the `HANDOFF.md` pointer and never edit another session's `HANDOFF.d/` file.

## Companywide business rules

Business logic is companywide and organized by topic, not by application. Start at the [companywide application and task map](https://github.com/u2giants/shared-db/blob/main/docs/business-rules/application-map.md) and load only the topics the task touches. This repo documents CRM implementation; it must not maintain a competing copy of a business rule.

## Open plans (read the plan's STATUS first; never re-plan)

- [`plan_codebase_audit_remediation.md`](plan_codebase_audit_remediation.md) — audit remediation, Sessions 13 (worker batching) and 14 (promotion residue) still pending in its ledger.
- [`fix_bugs.md`](fix_bugs.md) — Part 1 landed via PR #7; Part 2 still open.
- [`fix_remove_account.md`](fix_remove_account.md) — final shared-db drop of deprecated `crm_account_*` names still pending.
- Finished plans (CRM basic CRUD, live-data, and the rest) are listed with status in the `plan`, `spec` and `proof` sections of [`docs/INDEX.md`](docs/INDEX.md).

## Project summary

`popcrm-web` is the **POP CRM frontend** — a Vite/React/TypeScript single-page app served by nginx, used by internal POP Creations staff to run customer, sales, licensing and product-development workflows: customers, contacts, the program pipeline, Outlook-ingested email routing, Fireflies meeting notes, notes, tasks, licensor approvals, and AI-model settings.

It **stores no data of its own** — every read/write goes through the shared Supabase project (`https://qsllyeztdwjgirsysgai.supabase.co`). The CRM backend is a Supabase/Postgres port of the retired CRM data model. The outcome that matters: a fast, dense operations console over that shared data.

- Production: `https://crm.designflow.app` · Preview: `https://crm-dev.designflow.app`
- Fireflies webhook/health: `https://crm-fireflies.designflow.app`
- Sibling frontends (separate repos): `poppim-web` (PIM), `popdam-web` (DAM)

## AI tool notes

Claude Code uses `.claudeignore`. Other tools should skip `node_modules/`, `dist/`, `.env`, and generated output — see "What to ignore" below.

## Documentation map: what to read for each task

Always start with:

- `AGENTS.md` (this file), then [`docs/INDEX.md`](docs/INDEX.md) when a task names a topic you do not already know

Then load additional docs only when relevant:

| Task / question | Read these docs | Usually do not need |
|---|---|---|
| Quick repo orientation | `README.md`, `AGENTS.md` | Deep docs under `docs/` |
| Which file do I edit for change X | `docs/agents-reference.md` (task-to-file table, repository structure) | Deep docs under `docs/` |
| Modify app behavior or project-owned code | `AGENTS.md`, `docs/architecture.md` if data flow/shape changes | `docs/deployment.md` unless deploy behavior changes |
| Add/change config, env vars, or runtime settings | `docs/configuration.md`, `docs/agents-reference.md` (env table), `docs/deployment.md` if prod affected | Unrelated architecture docs |
| Change local setup, dev/test/lint scripts, or tooling | `docs/development.md`, `package.json`, `eslint.config.js` | `docs/deployment.md` unless CI/CD changes |
| Change deployment, Docker, CI/CD, hosting, release, or rollback | `docs/deployment.md`, `.github/workflows/deploy.yml`, `Dockerfile`, `nginx.conf` | Local-only dev docs |
| Change data shape, Supabase fields, queries, views, RPCs, or identifiers | `docs/architecture.md`, `docs/agents-reference.md` (data model + identifiers), `src/lib/types.ts`, `src/lib/database.types.ts`; canonical `/worksp/shared-db/supabase/migrations/` for backend changes | Deployment docs unless rollout changes |
| Investigate bugs or incidents | `AGENTS.md`, [`docs/critical-incidents.md`](docs/critical-incidents.md), [`docs/quirks.md`](docs/quirks.md) if behavior looks intentional-but-surprising, area-relevant source | Full incident history |
| Continue unfinished work | `AGENTS.md`, `HANDOFF.md` (pointer) → open files in `HANDOFF.d/`, newest first, and the docs they name | Docs outside the handoff scope |
| Change contact/program/task/customer create, delete, merge | [`plan_crm_basic_crud.md`](plan_crm_basic_crud.md) — done plan, STATUS table first | Re-planning it |
| Surprising behavior / non-obvious rules | [`docs/quirks.md`](docs/quirks.md) | Full incident history |
| Claude Code session | `CLAUDE.md`, then `AGENTS.md` | Other docs unless the task requires them |
| Documentation-only cleanup | `AGENTS.md`, `README.md`, affected `docs/`, ignore files | Source files except to verify accuracy |
| Pull secrets from 1Password | [`docs/1password.md`](docs/1password.md) | Unrelated architecture/deploy docs |

Notes:

- `HANDOFF.md` is the **static pointer** to `HANDOFF.d/`; when it exists, the open files under `HANDOFF.d/` are required reading for continuation tasks. Every file there is an OPEN workstream; finished ones are deleted.
- Shared non-code infrastructure/server standards live in [`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure). When deployment, domains, runtime ownership, server dependencies, break-glass runbooks, or infrastructure decisions change for this app, update that repo too.

## Repository structure

Project-owned: `src/app/` (shell + router), `src/components/app/` (shared building blocks), `src/features/crm/` (domain: data context, api, pages, drawers), `src/auth/`, `src/pages/`, `src/lib/`, `docs/`, `.github/workflows/`, root config (`Dockerfile`, `nginx.conf`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`). Full tree with per-file detail: [`docs/agents-reference.md`](docs/agents-reference.md). Build artifacts / ignored: `dist/`, `node_modules/`.

## Prime Directive: custom-code boundary

Our custom code lives here:

- `src/app/`
- `src/components/app/`
- `src/features/`
- `src/auth/`, `src/pages/`, `src/lib/`
- `docs/`
- `.github/workflows/`
- root config: `Dockerfile`, `nginx.conf`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`

Everything else requires justification before touching. In particular, `src/components/ui/*` are shadcn-style primitives (see below).

## Core modification inventory

Files modified outside the clearly project-owned application areas:

| File | Change made | Why it was necessary | Risk during upgrades |
|---|---|---|---|
| `src/components/ui/*.tsx` | Hand-authored shadcn-style primitives (tabs, select, table, tooltip, popover, dialog, label, chart, etc.) using the unified `radix-ui` import style | shadcn CLI/registry not run here; primitives added to match existing ones | Running `npx shadcn add` could overwrite/conflict; keep the `radix-ui` (not `@radix-ui/*`) import style and Lucide icons |
| `Dockerfile` | Added `COMMIT_HASH` / `COMMIT_DATE` / `VITE_LOGODEV_TOKEN` build args before `npm run build` | `.git` is dockerignored (commit identity passed by CI); `VITE_*` is build-time so the logo.dev token must be baked at build | If the header build-stamp is removed, drop the commit args too; `VITE_LOGODEV_TOKEN` is optional (empty → initials avatars) |

No third-party/vendor/framework source files are modified. `src/components/ui` is the only "generated-style" area, and it is hand-maintained in this repo.

## Task-to-file navigation

The what-to-edit table (page/drawer/query/route/theme/primitive/build/env/impersonation rows, each with files-not-to-touch) lives in [`docs/agents-reference.md`](docs/agents-reference.md).

## Data model and external identifiers

The entity table (Customer, Ingested domain, Contact, Department, Opportunity, Email, Meeting note, Note/Task, Ignore rule, AI model config, Licensor approval) and the Coolify/GHCR/domain identifier tables live in [`docs/agents-reference.md`](docs/agents-reference.md). Do not casually rename, regenerate, or replace documented identifiers.

## Container and service inventory

This repo owns exactly one runtime container (`popcrm-web`, Coolify app `a1vb55by4benmh25nd4ga8pt`); the host workers, Supabase, the Fireflies container and the reverse proxy are external dependencies on the same host. Full table: [`docs/agents-reference.md`](docs/agents-reference.md).

## What to ignore

Do not load these into AI context unless explicitly needed:

- `node_modules/`, `dist/`, `.env`, `*.local`, `.cache/`, `coverage/`
- `shared-db/` (read-only vendor mirror; search it only for database tasks)
- Leftover Vite-template assets (unused): `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`

These align with `.claudeignore` and `.cursorignore`.

## Intentional quirks and non-obvious decisions

Full text lives in [docs/quirks.md](docs/quirks.md). Load it when a screen, filter, status label, worker, or import path behaves surprisingly. Do not re-derive those rules from code alone.

## Credentials and environment

Build-time `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (required), optional `VITE_LOGODEV_TOKEN`; CI-only Coolify/GHCR tokens live as GitHub secrets. Full table with storage locations: [`docs/agents-reference.md`](docs/agents-reference.md); how to read secrets: [`docs/1password.md`](docs/1password.md). No secret values appear in this repo.

## Deployment

Single orchestrated workflow: push to `main` → GitHub Actions builds, publishes `ghcr.io/u2giants/popcrm-web` (tags `latest`, `main`, `sha-<sha>`), and triggers Coolify app `popcrm-web` (`a1vb55by4benmh25nd4ga8pt`). CI never SSHes into the server; runtime env is owned by Coolify; rollback = redeploy a previous `sha-<sha>` image. **SSH is not the normal path.** Full detail: [`docs/deployment.md`](docs/deployment.md).

## Critical incidents

Full text lives in [docs/critical-incidents.md](docs/critical-incidents.md). Load it when investigating a regression, blank page, deploy failure, or data-access gate.

## Pending work

| Status | Item | Owner/next action |
|---|---|---|
| open | Audit plan Sessions 13 (worker batching) and 14 (promotion residue) | [`plan_codebase_audit_remediation.md`](plan_codebase_audit_remediation.md) ledger rows 13/14 |
| open | `fix_bugs.md` Part 2 | See its Part 2; one owner decision outstanding (fuzzy PO matching) |
| open | Final shared-db drop of deprecated `crm_account_*` compatibility contracts | [`fix_remove_account.md`](fix_remove_account.md) step 3 |
| blocked | Customer logos go live | Code deployed but inert until `LOGODEV_TOKEN` GitHub secret is set (publishable logo.dev key) — falls back to initials until then |
| open | Server-side pagination / Supabase aggregates | Currently client-side for CRM screens; revisit if record volumes grow |
| open | Bump CI actions off Node 20 | GitHub deprecates Node-20 actions (~2026-06-16); update `actions/*` and `docker/*` versions in `deploy.yml` |
| unknown | `crm_licensor_approval_thread.stage` values | Free-form, 0 rows today; verify real values via backend when approval data exists |
| open | Task assignee picker needs a non-admin profile source | `CreateTaskDialog` (issue #24) omits assignee: the only profile-list RPC (`api.crm_admin_user_list`) is admin-gated. Needs a CRM-scoped profile projection in shared-db |
