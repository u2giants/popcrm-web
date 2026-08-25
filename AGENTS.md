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

## Multi-model AI note

There is no universal ignore-file standard across AI coding tools.

`.claudeignore` works for Claude Code.

When using any other AI tool, paste this file as your first message and follow the instructions in the "What to ignore" section.

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
| Investigate bugs or incidents | `AGENTS.md` (Critical incidents), area-relevant source, `HANDOFF.md` if present | Unrelated docs |
| Continue unfinished work | `AGENTS.md`, `HANDOFF.md` (if present) and the docs it names | Docs outside the handoff scope |
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
| Customer | `core.customer` / `api.customer_list` (shared) plus CRM-specific `api.crm_customer_*` contracts | Supabase | shared customer hub. `is_potential = false` means PLM/ERP-confirmed active customer; `true` means tracked potential customer. `customer_status` remains the CRM workflow/status axis. Use `api.crm_customer_segment_list` / `api.crm_customer_segment_counts` for CRM customer page tabs and active pickers. Legacy `api.crm_account_list` / `api.crm_update_account` names are deprecated compatibility contracts only; do not add new callers. `api.crm_customer_list.logo_url` exposes PLM-imported full-width logo URLs when available |
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

### Bootstrap loader tolerates a failing collection

Looks like:
`CrmDataContext.load()` uses `Promise.allSettled` and per-collection setters instead of one `Promise.all`.

Actually:
Each Supabase view/table/RPC load runs independently; a failing one leaves its
section empty and a hard error shows only if everything fails.

Why:
A single 403 on one legacy collection previously blanked the entire app. See Critical incidents 2026-06-12.

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
The CRM approval `stage` field has no fixed choices, and the collection currently
has 0 rows.

Why:
The real schema differs from earlier assumptions; matching keywords is robust to unknown values.

Do not change because:
Hard-coding an enum would re-introduce the wrong field/value assumptions that caused the 2026-06-12 incident. Verify real values via the backend once approval data exists.

### `customer_status` labels/tones are context-specific — `OTHER` is NOT a global label override

Looks like:
You could add `OTHER: 'Not a Customer'` to `format.ts` `LABEL_OVERRIDES` to relabel it.

Actually:
`OTHER` is a shared enum value — it also means "Other" for `chain_type`, `contact_type`,
and routing. The customer-status relabel/recolor lives in
`constants.ts:customerStatusLabel` / `customerStatusTone` (and `CUSTOMER_STATUS_LABEL`),
used only by the Customers table/drawer — never in the global `label()`.

Why:
A global `OTHER` override would wrongly rename every other column's "Other".

Do not change because:
Putting `OTHER` (or `UNASSIGNED`) into the global `label()` overrides silently
corrupts chain/contact/routing labels. Status colors: green active, yellow
potential, blue New Company (untriaged), gray Not-a-Customer — no red.

### Customers Triage is ingested domains, not customer rows

Looks like:
You could load Customers → Triage from `api.crm_customer_list` rows where
`customer_status` is `UNASSIGNED`.

Actually:
Email-domain noise lives in `crm.ingested_domain` and is exposed through
`api.crm_ingested_domain_list`. Those rows are not customers and should
use the `CrmIngestedDomain` frontend type, not `Retailer`. The Triage table shows
domain evidence and a promote action; it must not render customer-only inline
status/chain edits or `CustomerDrawer`.

Why:
`core.customer` is the shared hub used by CRM, PM, DAM, and PLM. Random email
domains must never become shared customer rows. Promotion was removed entirely
by shared-db migration `20260629034600` (it had polluted the customer list);
ingested domains stay triage-only, and customers are created solely through the
curated customer path. `is_potential = true` still marks a curated customer we
have not yet done business with.

Future sessions should:
Keep customer lists and customer pickers on customer-scoped API contracts
(`api.customer_list` for shared/basic reads, or a CRM-specific
`api.crm_customer_*` view when CRM-owned fields are needed); keep Customers
Triage on `api.crm_ingested_domain_list`. Do not add new `account`-named API
contracts or callers. Existing `api.crm_account_list` / `api.crm_update_account`
objects are legacy compatibility names and should only be dropped after every
deployed client has moved to customer-named contracts. If a frontend change requires a new
view/RPC/policy/trigger, make that change in canonical `/worksp/shared-db` and
document it in the appropriate `u2giants/shared-db` `.md` file, not this repo's
vendored `shared-db/` mirror.

### Customer tabs use server segments

What changed:
Browser verification on 2026-06-28 showed broad
`api.crm_customer_list?select=*` reads and exact counts could still time out
after the account-to-customer contract rename. Migration
`20260629033000_crm_customer_segment_timeout_fixes.sql` adds
`api.crm_customer_segment_list(p_segment, p_limit)` and
`api.crm_customer_segment_counts()`.

Why:
The Customers page needs active, dismissed, and all counts/rows, but the browser
should not page or count the full customer compatibility view. Segment RPCs
filter `core.customer` directly and return the needed rows/counts quickly.

Future sessions should:
Keep Customers page tabs and active customer pickers on
`useCustomerSegmentQuery` / `useCustomerSegmentCountsQuery`. Do not restore
full browser paging or exact head counts against `api.crm_customer_list`.

### Contacts page customer segmentation and customer edit choices

What changed:
Contacts are customer-facing only when their linked customer has
`customer_status` `ACTIVE_CUSTOMER` or `POTENTIAL_CUSTOMER`. `Cust Contacts`
requires that customer and no department; `Dept. Contacts` requires that
customer and a department; all contacts not linked to a customer
belong in `Triage`.

Why:
Contacts linked to reviewed non-customers (`OTHER`) or untriaged customers were
previously appearing in customer/dept sections, which overstated the customer
contact list.

Future sessions should:
Keep `ContactsPage` customer dropdowns row-aware. Customer/dept rows should offer
only Active/Potential customers; triage rows may offer Active/Potential
plus `OTHER` ("Not a Customer") customers so users can classify contacts without
showing every customer in the system.

Likewise the Department dropdown is row-aware (`departmentOptionsFor`): it filters
`crm_department` by the row's selected customer (`idOf(d.retailer) === accountId`),
matching the pattern in `EmailDrawer`. With no customer selected it falls back to
all departments. Changing a row's customer also clears any department that no
longer belongs to the new customer (handled in `editCell`). Previously the
Department column used a single static list of every department regardless of the
chosen customer.

### Contact relationship edits require customer context and explicit clear flags

What changed:
On 2026-06-23, the Contacts page and Data Admin contact cleanup were updated to
send the current customer (`retailer`) whenever editing relationship-owned fields
such as `department`, `contact_type`, or `scope`. Migration
`20260623024500_crm_update_contact_clear_relationship_fields.sql` updates
`api.crm_update_contact` with explicit `p_clear_*` flags so the UI can clear
customer, department, type, and scope values intentionally.

Why:
`core.contact_company.company_id` is required, so department/type/scope edits
must target a specific contact-company relationship row. The previous RPC used
`coalesce`, which made `null` mean "leave unchanged"; Data Admin's "Move and
Clear Type" and inline unassign actions could appear to work optimistically while
the database preserved the old value.

Future sessions should:
Do not remove the frontend fallback to the old RPC shape until the shared-db
migration is confirmed applied in production. When editing relationship-owned
contact fields, include the contact's current customer (or infer it from the
selected department) and use explicit clear flags rather than assuming `null`
will clear a backend value.

### Contacts load by Supabase server segment; avoid derived-field filters/order

What changed:
After the Supabase cutover, Contacts read through browser-safe API views. On
2026-06-22, `shared-db` migration
`20260622043000_crm_contact_segments.sql` preserved `api.crm_contact_list`, added
the explicit `app.has_app_access('crm')` guard, and introduced
`api.crm_contact_segment_list` / `api.crm_contact_segment_counts`. The Contacts
page now fetches Cust Contacts, Dept. Contacts, and Triage as server-computed
segments; All is lazy-loaded only when opened.

Why:
The original `security_invoker` view plus PostgREST ordering/filtering on derived
fields (`name`, `company_customer_status`) timed out during the paged browser
load (page `2000-2999`), so `CrmDataContext` set contacts empty and the UI showed
all contact counts as 0 even though 8,654 contacts existed. Later, trying to cap
contact lists client-side hid most records. Server segments give each visible tab
complete data without forcing the All list to load immediately.

Future sessions should:
Do not re-add server-side `order('name')` or
`.in('company_customer_status', ...)` to contact fetches. Use
`crm_contact_segment_list.crm_segment = customer|department|triage` plus
`crm_contact_segment_counts`; keep table search/sort client-side inside the
loaded segment. `api.crm_contact_list` remains the generic/fallback contract. If
Contacts are zero, test the exact authenticated REST pages and check
`app.profile.auth_user_id` / `app.app_access` before assuming data is missing.

### Customer/vendor pickers label with hub `display_name` and filter hub `status`

What changed:
On 2026-07-17 the shared customer hub gained `core.customer.display_name` and a
three-state `status` (`active` / `potential` / `inactive`; most ERP-imported
rows are inactive), exposed through `api.crm_customer_list` /
`api.crm_account_list` and the `api.crm_customer_segment_list` RPC (shared-db
migrations `20260717122317`, `20260717125909`, `20260717160023`, with trigram
indexes for type-ahead). CRM customer pickers now label options with
`display_name ?? name` and default selectable options to hub-status
active/potential; the legacy `customer_status` axis no longer gates pickers
(except the Contacts triage "(Not a customer)" carve-out).

Why:
The Coldlion ERP import pushed the hub to 859 customers (707 inactive), so
pickers were unusable and showed long legal names.

Future sessions should:
- Build customer option lists with `customerPickerOptions` /
  `customerEditOptions` (+ `withCurrentCustomer` for edit contexts) from
  `src/features/crm/pages/_shared.ts`; labels via `customerLabel` in
  `format.ts` (`relatedName` also prefers `display_name`).
- Feed pickers from `useCustomerSegmentQuery('all', -1)` and filter client-side
  with `isSelectableCustomer(r.status)` — the RPC's `'active'` segment still
  filters the legacy `customer_status` axis and would hide ERP-active but
  CRM-untriaged customers.
- Keep the currently-referenced record reachable: a Combobox's selected label
  comes from its options, so the current (possibly inactive) customer must stay
  in the list; DataTable edit cells render from row data, so filter options
  freely there.
- Vendors (`core.factory`) have no `api.*` view and no picker in this app yet —
  opportunity `factory` is read-only via `crm_opportunity_list`
  (`factory_name`; adapters already pass through `factory_display_name` /
  `factory_status` for when the views expose them).

### Email Routing uses a recent feed plus server counts

What changed:
After the customer-contract rename, browser verification showed Email Routing
could still time out because the app paged the full joined
`api.crm_email_routing_queue` view and computed segment counts client-side.
Migration `20260629031500_crm_timeout_fixes.sql` adds
`api.crm_email_routing_recent(p_limit)` and
`api.crm_email_routing_segment_counts()`.

Why:
Production has enough historical emails that a broad joined queue read can hit
PostgREST statement timeouts and leave the UI empty or stale. The recent feed
limits `crm.email_message` first, then joins labels; the count RPC computes full
tab badges server-side.

Future sessions should:
Keep Email Routing's table on `useEmailsQuery(EMAIL_ROUTE_LIMIT)` with a
positive limit, and keep tab badges on `useEmailSegmentCountsQuery`. Do not
restore `useEmailsQuery(-1)` for Email Routing or use full queue paging to
compute counts. Small explicit-limit global search against
`api.crm_email_routing_queue` is still acceptable.

### Not-customer rules are administrative settings

What changed:
The rule editor lives in Settings, not in the Email Routing work queue. Settings
shows separate, always-visible inputs for an exact email address and an entire
domain, plus a separate subject-pattern control. Domain input accepts either
`example.com` or `@example.com` and stores the normalized domain.

Why:
These rules change automated routing behavior for everyone, so they are
administrative configuration rather than a per-message routing action.

Future sessions should:
Keep the editor in `SettingsPage` via `IgnoreRulesPanel`. Address and domain
rules must continue to apply only when an email contains no recognized Customer
domain; a known Customer participant must take precedence over a not-customer
rule.

### Fireflies health does not prove meeting ingestion

What changed:
On 2026-06-14, `/health` for `crm-fireflies.designflow.app` returned 200 and the
`popcrm-fireflies` container was running, but the CRM backend had only 27
meeting-note rows with latest meeting date `2026-04-14`. The Fireflies API listed
newer transcripts through `2026-06-11`, while worker/proxy logs showed no recent
webhook deliveries.

Why:
The health endpoint only proves the webhook server is reachable. It does not
prove Fireflies is configured to send "transcription complete" events to
`https://crm-fireflies.designflow.app/s/fireflies-webhook`.

Future sessions should:
When meeting ingestion is stale, check CRM row dates, `popcrm-fireflies` logs,
proxy logs, and the Fireflies dashboard webhook configuration before debugging
the frontend. Do not assume a green Fireflies badge means notes are ingesting.

### CRM host workers live in this repo

What changed:
On 2026-06-26, the active CRM host worker runtime moved into
`workers/crm-worker-supabase.mjs` in this repo.
Installed systemd units use the templates in `systemd/`, and the
`popcrm-fireflies` container bind-mounts `/worksp/popcrm-web` read-only and runs
the same Supabase worker with `fireflies-server`.

Why:
The CRM backend source of truth is Supabase.com and canonical schema/docs live in
`/worksp/shared-db`. Retiring an old backend must not affect Outlook ingest,
reroute, contact sync, summaries, ignore-rule sweeps, opportunity chat, or
Fireflies ingestion.

Future sessions should:
Keep `/home/ai/.crm-worker.env` out of git. It must include `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`; do not put service-role keys in Vite/browser config.
After changing worker code, run `node --check workers/crm-worker-supabase.mjs`
and relevant one-shot systemd smoke tests. Unknown domains must continue to go
through `crm.record_ingested_domain(...)`, not direct `core.customer` inserts.

### Customer logos use token domains plus optional full-logo overrides

Looks like:
Logos might have been migrated from Twenty as uploaded files.

Actually:
Twenty's `company` table has **no logo/avatar/image column** — Twenty rendered
logos live from each company's domain via its `twenty-favicon` service. There was
nothing to migrate from Twenty. Compact token logos still come from
`img.logo.dev` keyed on `retailer.domain` (token `VITE_LOGODEV_TOKEN`). Full-width
logos come from `api.crm_customer_list.logo_url`, which prefers the CRM manual
override stored at `core.customer.metadata.crm_logo_url` and falls back to the
PLM-imported `plm.customer_import.logo_url`. The Data Admin → Logos tab can
upload full logos to the `crm-customer-logos` Supabase Storage bucket, save a
full logo URL, clear the override, or update the token-logo domain.
The publishable logo.dev token is stored in 1Password at
`op://vibe_coding/logo.dev publishable token - popcrm-web/password` and mirrored
to the GitHub Actions secret `LOGODEV_TOKEN`.

Why:
The user's "uploaded" Twenty logos never existed as stored files; domain-derivation
is the same mechanism Twenty used.

Do not change because:
Don't go looking for legacy Twenty logo files — there weren't any. Preserve the
two-layer contract: token domain on `core.customer.domain`; full logo URL from
CRM override first, then PLM import. Do not write CRM uploads back into
`plm.customer_import`.

### Supabase profile links control whether signed-in users see CRM rows

What changed:
During the 2026-06-22 contacts incident, the imported data was present but a
signed-in user with no linked `app.profile.auth_user_id` saw empty CRM lists.
Linking the existing `app.profile` row to the Supabase Auth user and confirming
`app.app_access` for `crm` restored access. On 2026-07-03, Microsoft SSO for
some users failed before the app rendered with Supabase Auth's
`Database error saving new user` callback error because pre-seeded
`app.profile` rows had unique emails but no `auth_user_id`. A follow-up case for
`adweck@popcre.com` had the same callback error because the CRM profile email was
linked to an older Google Auth user with a different email.

Why:
RLS and API views are app-access gated. Supabase Auth can authenticate a browser
session while the CRM profile/app-access mapping is still missing or stale. The
first-login auth trigger must link imported profiles by email before inserting a
new profile, otherwise `app.profile.email` can collide and abort `auth.users`
creation. It must also relink same-email CRM profiles when their existing
`auth_user_id` points at an Auth user whose email does not match the CRM profile
email.

Future sessions should:
If one user sees zero records while service-role counts are nonzero, verify
`auth.users.id -> app.profile.auth_user_id` and the user's `app.app_access` row
for `crm` before debugging frontend filters or rerunning imports. If Microsoft
SSO redirects back with `error_description=Database error saving new user`, check
the shared-db migration `20260703172500_fix_crm_auth_profile_email_link.sql`,
follow-up migration `20260703220000_fix_crm_auth_profile_mismatched_email_relink.sql`,
the `app.handle_new_auth_user()` trigger function, and whether the user's
`app.profile.email` is unlinked or linked to an Auth user with a different email.

### Admin impersonation is a frontend "view as", not a data-layer switch

Looks like:
Impersonation might run queries under the target user's Supabase session so RLS
returns their rows.

Actually:
It is a **frontend identity overlay**. `src/auth/auth.tsx` keeps the real
signed-in account (`realUser`) and, when an admin impersonates, an
`impersonating` `AppUser`; `useAuth().user` returns `impersonating ?? realUser`.
The Supabase session never changes — the admin's own JWT still authorizes every
request. This is correct here because CRM `api.crm_*` list views gate on **app
access**, not per-user row ownership: every crm-access user sees the same shared
rows. The only things that vary per user are the rendered identity and
role-gated UI (e.g. Email Routing's `canSeeAll = /admin/`), and those read
`useAuth().user`, so the overlay reproduces them faithfully. Impersonation is
admin-only (`isAdmin` from `realUser.roles`), persisted per tab in
`sessionStorage` (`popcrm_impersonate`), and cleared on stop/logout.

The user list comes from the admin-gated `api.crm_admin_user_list()` RPC in
canonical `/worksp/shared-db` (migration
`20260715184500_crm_admin_user_list.sql`) — the browser cannot read the `app`
schema directly, so identity listing must go through an `api` function. A
follow-up migration `20260715223108_crm_admin_user_list_exclude_service_accounts.sql`
filters service/test accounts (`%@example.com`, `svc@%`, `codex%`, `%e2e%`) out
of that RPC so the picker lists only real people; extend the denylist there
(server-side), not in the frontend.

Do not change because:
Adding a real per-user session switch (service-role or minted JWTs) would be a
large, security-sensitive backend build that returns identical rows anyway,
since the data is shared. If per-user row scoping is ever added to the CRM
views, revisit whether the overlay still reflects reality.

Admin emails:
`app.handle_new_auth_user()` auto-grants the `administrator` role to
`u2giants@gmail.com` and `albert@popcre.com` on first SSO login (same migration
also backfilled albert's existing profile). Impersonation and any other
administrator-gated capability follow the DB role, not a frontend allowlist.

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

### DataTable horizontal scroll can be caused by header resize handles

What changed:
On 2026-06-30, Data Admin's department table showed a horizontal scrollbar even
when there was visible empty page space. Two causes overlapped: the page body was
capped at `max-w-6xl`, and `DataTable` rendered as `w-max` with resize handles
positioned `right-[-4px]`, making the last header cell overflow by 4px.

Why:
The table was being squeezed inside an artificially narrow centered wrapper; the
off-cell resize handle then created a scrollbar even when the table otherwise
fit.

Future sessions should:
Keep wide table pages full-width unless there is a deliberate readability reason
to cap them. If a table scrollbar looks unnecessary, verify with Playwright by
comparing the table wrapper's `clientWidth` and `scrollWidth`; do not trust the
visual screenshot alone. Current intended behavior is `DataTable` tables use
`min-w-full`, and resize handles stay inside header cells (`right-0`).

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

### 2026-06-22 Live-query refactor capped CRM screens

What happened:
After the TanStack Query refactor (`494b588`), primary CRM screens appeared to
lose most records. Customers loaded only the first 100 companies, Email Routing
only 50 messages, Pipeline/Programs only 100 opportunities, Notes only 50, Tasks
only 100, and related drawers/pickers/global search used the same partial slices.

Impact:
Production data was intact, but the UI presented partial datasets as complete
lists and produced wrong tab counts, related-record counts, overview stats, and
search results.

Root cause:
The refactor replaced global full loads with page-scoped query hooks but added
hard-coded client limits before server-side pagination/search/count contracts
existed. A bounded page query without an aggregate/count/search contract silently
lies in this CRM.

Recovery:
`698885b` restored full paged reads (`limit = -1`) for main CRM record surfaces,
drawers, command search, and overview stats. Follow-up work made Contacts load by
server segment, Customers load eagerly, Customers Triage load from
`api.crm_ingested_domain_list`, and Not-a-Customer/All load only on demand.

Rule added to prevent recurrence:
Do not add arbitrary positive limits to CRM list hooks unless the page also has
server-side pagination, search/filtering, and true aggregate counts. If a page
shows "All" or computes tab counts/client filters from a query, that query must
represent the full relevant dataset or a documented server segment with counts.

### 2026-06-22 Contacts zero after Supabase cutover — contact view timeout/access gate

What happened:
`/contacts` showed 0 for every segment after the legacy-backend import,
even though the Supabase tables contained 8,654 contacts and 3,744 canonical
companies.

Impact:
The Contacts page looked empty for authenticated users and invited rerunning the
data import unnecessarily.

Root cause:
Two issues overlapped: users without a linked `app.profile.auth_user_id` could
authenticate but see no CRM rows, and the original `security_invoker`
`api.crm_contact_list` view timed out on the browser's third 1,000-row page when
PostgREST applied derived-field ordering/filtering.

Recovery:
The import was reconciled, affected profiles were linked to Supabase Auth users,
the frontend stopped server-side contact ordering/filtering, and migration
`20260622043000_crm_contact_segments.sql` preserved `api.crm_contact_list` as an
access-gated `security_invoker=false` view and added server-computed contact
segments/counts.

Rule added to prevent recurrence:
Verify authenticated REST page loads (`0-999`, `1000-1999`, `2000-2999`, etc.)
and profile/app-access mapping before changing contact segmentation or rerunning
the legacy import.

### 2026-06-22 Bad Gateway after deploy — Coolify proxy lost Docker socket

What happened:
After a successful deploy, `crm.designflow.app` returned 502 while the app
container was healthy and nginx inside the container returned 200.

Impact:
The live CRM was unreachable even though the new static bundle was running.

Root cause:
`coolify-proxy`/Traefik logged `Cannot connect to the Docker daemon at
unix:///var/run/docker.sock`, so Traefik could not discover the newly deployed
Coolify container and had no valid upstream.

Recovery:
Restarting `coolify-proxy` restored Docker provider discovery and the site
returned HTTP 200.

Rule added to prevent recurrence:
When live returns 502 after deploy, first check `docker ps`, app container logs,
and `docker exec <container> wget http://127.0.0.1/contacts`. If the app is
healthy but proxy logs show Docker provider errors, `docker restart coolify-proxy`
restores route discovery.

### 2026-06-12 Every page blank — approvals schema mismatch + all-or-nothing loader

What happened:
After the redesign deploy, every page showed "Something went wrong / data could not be loaded."

Impact:
The whole CRM UI was unusable while signed in (no page rendered data).

Root cause:
`fetchApprovalThreads` requested `crm_licensor_approval_thread` fields that don't
exist in the retired backend (`licensor_name`, `approval_status`, `submitted_at`, `approved_at`,
`latest_comment`). The retired backend returned 403 for the unknown fields. The loader used
`Promise.all`, so that single rejection failed the entire bootstrap and blanked all pages.

Recovery:
Two commits: `29ea195` switched the loader to `Promise.allSettled` (resilience);
`3592b88` mapped approvals to the real fields (`property_name`, `stage`,
`submitted_date`, `response_date`, `due_date`, `licensor_comments`). Verified the
corrected query returns 200 and the live site loads.

Rule added to prevent recurrence:
Never load all collections all-or-nothing; verify requested fields against the real
actual source schema (`information_schema.columns`) before relying on them.

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
| done | Admin impersonation ("view as another user") | Frontend identity overlay (`auth.tsx`), admin-only picker (`ImpersonationDialog`), orange exit bar (`ImpersonationBar`); backed by admin-gated `api.crm_admin_user_list()` in shared-db; `albert@popcre.com` granted `administrator`. See Quirks. Verified end-to-end 2026-07-15 |
| done | Pipeline list/board toggle | DataTable list view + existing board; segmented control in ListBar |
| done | OpportunityModal: Ask AI, Share, Expand/collapse | All three top-bar actions wired; composer calls `createNote` API |
| done | `label()` enum overrides | `AI`, `DETERMINISTIC`, `IN_PROGRESS`, `TODO`, routing statuses all map to readable labels |
| done | Email routing: Method column | Replaced Department column; `MethodChip` + `MethodConfidence` in drawer |
| done | Overview activity panels | Reduced to 2 (Meetings + Approvals); deep-links via `useRecordSelection` |
| done | Approvals columns | Name · Licensor · Status · Submitted · Program · Latest comment per spec |
| done | All record drawers polished | Meeting/Task/Email/Note/Approval drawers match spec |
| done | DataTable ag-Grid-style tools | Persistent per-column filter icon → checkbox value popover; per-column header quick-search + autocomplete; visible resize separator; inline-edit dropdowns (`editOptions`/`onCellEdit`); spreadsheet drag-to-copy fill handle |
| done | Customers status/chain UX | Real-schema colored chips; inline-editable; Twenty logos via logo.dev; segmented tabs (Customers/Triage/Not a customer/All), with Triage backed by `api.crm_ingested_domain_list` |
| done | Customer status data normalized | 24 null `customer_status` rows → `UNASSIGNED` during the legacy cutover; now one "New Company" bucket |
| done | Legacy-to-Supabase CRM data import/reconciliation | Completed 2026-06-22; verified 8,654 contacts, 3,744 canonical customer rows, 38 departments, 11,267 emails, 27 meetings, and matching zero-count tables |
| done | Contacts zero after Supabase cutover | Fixed 2026-06-22 via frontend client-side contact segmentation plus `api.crm_contact_list` access-gated view migration |
| done | Live-query refactor cap regression | Fixed 2026-06-22; restored full reads/true counts for CRM screens and documented the "no arbitrary limits without server contracts" rule |
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
