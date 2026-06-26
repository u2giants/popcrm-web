# CRM Backend Migration Plan: Directus To Shared Supabase

> **Status: historical migration plan — completed.** The current CRM backend is
> the shared Supabase project and the active worker runtime lives in
> `workers/crm-worker-supabase.mjs` in this repo. `/worksp/directus` references
> below are legacy source-material references from the migration period, not
> current runtime or setup instructions.

This document is the execution plan for migrating `u2giants/popcrm-web` from the
current Directus backend to the shared enterprise-wide Supabase backend.

It is written for a fresh AI/developer session with no prior chat context. Read
this file completely before making changes.

## Executive Summary

The CRM app currently reads and writes directly to a shared Directus API at
`https://data.designflow.app`. The new strategy is not to create a CRM-specific
Supabase project. Instead, CRM, PM/PIM, DAM, and operational PLM data will live
in one shared Supabase.com project with logical schemas.

The CRM migration has two parts:

1. Backend/data-layer work in the canonical shared database repo.
2. Frontend and worker rewrites in this CRM repo and the existing CRM worker.

Do not create a separate Supabase project for CRM.

Do not put permanent database DDL in this repo.

Do not run unreviewed SQL directly against production.

## Canonical Shared-DB References

The shared database plan is maintained in `u2giants/shared-db` and mirrored into
consumer repos under `shared-db/`. Mirrored copies are read-only and overwritten
by sync.

If the local checkout does not contain `shared-db/`, use the GitHub links below.

Primary shared-db docs:

- [Shared DB README](https://github.com/u2giants/popcrm-web/tree/main/shared-db)
- [Shared database vision](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/shared-database-vision.md)
- [Unified Supabase schema map](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/unified-supabase-schema-map.md)
- [Unified Supabase relationships](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/unified-supabase-relationships.md)
- [Unified Supabase migration gaps](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/unified-supabase-migration-gaps.md)
- [Supabase migration preparation](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/supabase-migration-prep.md)
- [Schema implementation notes](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/implementation/schema-implementation-notes.md)
- [Preview branch verification](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/verification/preview-branch-20260621.md)
- [Shared Supabase branch workflow](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/ai-session-instructions/shared-supabase-branch-workflow.md)
- [CRM-specific Supabase migration guide](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/ai-session-instructions/popcrm-web-supabase-migration.md)
- [AI session instructions index](https://github.com/u2giants/popcrm-web/blob/main/shared-db/docs/ai-session-instructions/README.md)

Baseline SQL migrations in shared-db:

- [20260621000100_foundation.sql](https://github.com/u2giants/popcrm-web/blob/main/shared-db/supabase/migrations/20260621000100_foundation.sql)
- [20260621000200_app_core.sql](https://github.com/u2giants/popcrm-web/blob/main/shared-db/supabase/migrations/20260621000200_app_core.sql)
- [20260621000300_domain_tables.sql](https://github.com/u2giants/popcrm-web/blob/main/shared-db/supabase/migrations/20260621000300_domain_tables.sql)
- [20260621000400_api_rls_realtime.sql](https://github.com/u2giants/popcrm-web/blob/main/shared-db/supabase/migrations/20260621000400_api_rls_realtime.sql)

## Supabase Targets

Use the shared Supabase project refs from the shared-db docs.

Preview branch:

```text
Project ref: xjcyeuvzkhtzsheknaiu
URL: https://xjcyeuvzkhtzsheknaiu.supabase.co
Branch name: shared-db-schema-rehearsal
Purpose: shared integration target for CRM/PM rewrite work
```

Production/default project:

```text
Project ref: qsllyeztdwjgirsysgai
URL: https://qsllyeztdwjgirsysgai.supabase.co
Purpose: live shared enterprise Supabase project; currently live PopDAM base
```

Important:

- Apply new CRM database migrations to preview first.
- Production promotion must happen through committed shared-db migration files.
- Do not manually copy SQL objects from preview to production in the Supabase dashboard.
- Defunct refs: `bhnrhaqesgomgeuppbjp` (never used) and `tcscehehgeiijilylezv` (first preview branch, deleted 2026-06-21 — DB was down). Active preview branch is `xjcyeuvzkhtzsheknaiu` (recreated 2026-06-21, all 9 migrations applied, PostgREST schema updated).

## Current CRM Architecture

`popcrm-web` is a Vite/React/TypeScript SPA. It stores no local business data.
All current business reads/writes go through the shared Directus backend at
`https://data.designflow.app`.

Production app:

```text
https://crm.designflow.app
```

Preview alias:

```text
https://crm-dev.designflow.app
```

Current Directus backend:

```text
https://data.designflow.app
```

Current Fireflies/CRM worker endpoint:

```text
https://crm-fireflies.designflow.app
```

## Current Directus Dependency Surface In This Repo

The CRM frontend is fairly well centralized around a small number of Directus
entry points. Migrate these deliberately.

Files to rewrite or adapt:

| File | Current role |
|---|---|
| `src/lib/directus.ts` | Directus SDK client, Directus URL, session-cookie auth mode, Microsoft SSO URL helper, Directus asset URL helper. |
| `src/auth/auth.tsx` | Directus `readMe`, login, logout, current user state. |
| `src/pages/LoginPage.tsx` | Calls `microsoftLoginUrl()` and email/password login. |
| `src/features/crm/api.ts` | All CRM collection reads/writes using `@directus/sdk`. |
| `src/features/crm/CrmDataContext.tsx` | Bootstrap loader. Must preserve `Promise.allSettled` behavior. |
| `src/lib/types.ts` | Hand-maintained Directus-shaped schema slice. |
| `src/features/crm/constants.ts` | Enum/status logic; may need updates if Supabase values differ. |

Search command to verify Directus usage:

```bash
rg "directus|@directus/sdk|readItems|createItem|updateItem|deleteItem|readMe|microsoftLoginUrl" src -n
```

Expected current direct dependencies include:

- `src/lib/directus.ts`
- `src/auth/auth.tsx`
- `src/pages/LoginPage.tsx`
- `src/features/crm/api.ts`
- occasional constant/docs references

## Historical Directus Backend/Worker Sources

The CRM backend schema and worker used to live in the sibling Directus repo.
These paths are source references for understanding the historical migration
only. Do not use them for current runtime, worker ownership, or new backend work.

Relevant files:

| File | Purpose |
|---|---|
| `/worksp/directus/pm-system/crm-schema.mjs` | Directus CRM schema source: collections, fields, relations, enums. |
| `/worksp/directus/pm-system/crm-roles.mjs` | Current Directus role grants for CRM collections. |
| `/worksp/directus/pm-system/crm-worker.mjs` | Outlook ingest, reroute, Fireflies webhook, contact sync, summaries, ignore-rule application, opportunity chat. |
| `/worksp/directus/pm-system/sql/enforce-crm-department-scope.sql` | SQL trigger logic enforcing department belongs to selected customer. |
| `/worksp/directus/pm-system/migration/split-customers-from-ingested.sql` | Current split between curated customer tables and raw ingested registries. |

If a future historical audit needs these files and `/worksp/directus` has been
deleted, inspect the `u2giants/directus` repository as legacy reference material.
Current backend migrations belong in canonical `/worksp/shared-db`.

## Current CRM Collections And Shared Supabase Targets

Do not carry Directus collection names forward blindly. The shared database uses
canonical schemas.

| Current Directus collection | Shared Supabase target | Notes |
|---|---|---|
| `retailer` | `core.company` | Curated customers. One canonical company table shared by CRM, PM, DAM, and PLM. |
| `ingested_domains` | `core.company_source_ref` and/or `ingest.raw_record` | Raw ingested company/domain registry. Do not expose directly to broad browser contracts. |
| `buyer` | `core.contact`, `core.contact_company` | Curated contacts/buyers. Contact-company relation carries customer relationship. |
| `ingested_contact` | `core.contact_source_ref` and/or `ingest.raw_record` | Raw ingested contact registry. Do not expose directly to broad browser contracts. |
| `factory` | `core.factory` | Canonical factory/vendor identity shared with PM and PLM. |
| `project` | `pim.project` | PM/PIM project. CRM opportunity may link to it. |
| `crm_department` | `crm.department` | CRM-owned customer department segmentation, linked to `core.company`. |
| `crm_opportunity` | `crm.opportunity` | CRM-owned sales/program pipeline, linked to `core.company`, `core.contact`, `crm.department`, `pim.project`, and possibly PLM production orders. |
| `crm_email_message` | `crm.email_message` | CRM-owned communication/routing record. Raw/sensitive bodies must not be broadly exposed. |
| `crm_meeting_note` | `crm.meeting_note` | CRM-owned meeting notes and Fireflies-derived summaries. |
| `crm_ignore_rule` | `crm.ignore_rule` | CRM-owned routing skip rules. |
| `crm_ai_model_config` | `crm.ai_model_config` | CRM-owned model settings. |
| `crm_note` | `crm.note` or later `app.comment` | Keep in `crm.note` initially unless the note becomes cross-domain. |
| `crm_task` | `crm.task` | CRM-owned task workflow. |
| `crm_licensor_approval_thread` | `crm.licensor_approval_thread` | CRM approval workflow; can link to PM submissions/revisions where known. |
| `directus_users` | `app.profile` | Supabase Auth owns identity; app profile owns business profile data. |

Hard rule:

Do not create duplicate `crm.company`, `crm.contact`, `crm.project`,
`crm.factory`, or CRM-only taxonomy tables. Shared identity/reference objects
belong in `core` or `pim`.

## Existing Baseline Shared Schema

The shared-db baseline migrations already implement these logical schemas:

```text
app
core
dam
pim
crm
plm
ingest
api
```

Important baseline objects:

```text
app.profile
app.role
app.user_role
app.app_access
app.comment
app.activity
app.notification
app.file_object

core.company
core.company_source_ref
core.contact
core.contact_source_ref
core.contact_company
core.licensor
core.property
core.character
core.factory
core.factory_source_ref
core.product_category
core.product_type
core.product_subtype
core.sku_ref

crm.department
crm.opportunity
crm.opportunity_product
crm.email_message
crm.meeting_note
crm.note
crm.task
crm.ignore_rule
crm.ai_model_config
crm.licensor_approval_thread

pim.project
pim.product
pim.product_submission
pim.revision_request

ingest.sync_run
ingest.raw_record
ingest.dedupe_candidate

api.crm_account_overview
api.global_search
```

The baseline is intentionally first-pass. It does not necessarily cover every
field or screen contract needed by the current CRM frontend.

## High-Level Migration Phases

Do the work in this order:

1. Read shared-db docs and current CRM code.
2. Audit current Directus collection fields and CRM frontend field usage.
3. Add missing shared-db migrations on the preview branch.
4. Build API views/RPCs for CRM screen contracts.
5. Design/import data from Directus into shared schemas.
6. Rewrite CRM frontend auth and API access to Supabase.
7. Port the CRM worker to Supabase service-role access.
8. Test everything against the preview branch.
9. Promote migrations to production through shared-db.
10. Cut over CRM frontend and worker.
11. Keep Directus read-only for rollback/reference during the stabilization period.

## Phase 1: Read And Audit

Start by reading the shared-db docs listed above. Then inspect the CRM frontend.

Commands:

```bash
pwd
rg "directus|@directus/sdk|readItems|createItem|updateItem|deleteItem|readMe|microsoftLoginUrl" src -n
sed -n '1,260p' src/features/crm/api.ts
sed -n '1,260p' src/lib/types.ts
sed -n '1,220p' src/auth/auth.tsx
sed -n '1,220p' src/lib/directus.ts
sed -n '1,260p' src/features/crm/CrmDataContext.tsx
```

If available, inspect the Directus backend source:

```bash
sed -n '1,460p' /worksp/directus/pm-system/crm-schema.mjs
sed -n '1,260p' /worksp/directus/pm-system/crm-roles.mjs
sed -n '1,1120p' /worksp/directus/pm-system/crm-worker.mjs
sed -n '1,180p' /worksp/directus/pm-system/sql/enforce-crm-department-scope.sql
sed -n '1,220p' /worksp/directus/pm-system/migration/split-customers-from-ingested.sql
```

Deliverable from this phase:

- A field-level inventory of every Directus field the CRM frontend or worker reads/writes.
- A gap list comparing those fields to existing shared-db baseline tables.
- A list of screens that can use existing `api` views and screens requiring new views/RPCs.

## Phase 2: Shared-DB Migration Workflow

All database changes go in `u2giants/shared-db`, not this repo.

From a checkout of `u2giants/shared-db`:

```bash
supabase link --project-ref xjcyeuvzkhtzsheknaiu
scripts/check-sql.sh
supabase db push --dry-run
```

Create new timestamped migrations for CRM-specific work:

```text
supabase/migrations/YYYYMMDDHHMMSS_crm_api_contracts.sql
supabase/migrations/YYYYMMDDHHMMSS_crm_directus_parity_fields.sql
supabase/migrations/YYYYMMDDHHMMSS_crm_worker_rpc.sql
supabase/migrations/YYYYMMDDHHMMSS_crm_rls_tightening.sql
supabase/migrations/YYYYMMDDHHMMSS_crm_realtime_contracts.sql
```

Naming rules:

- Use unique timestamps.
- Include `crm_` in CRM-specific migration names.
- Keep changes additive where possible.
- Add comments for security-sensitive policies and RPCs.

Apply only to preview first:

```bash
scripts/check-sql.sh
supabase db push --dry-run
supabase db push
supabase migration list
```

Never use production project ref while developing.

## Phase 3: Shared Schema Gap Resolution

Compare current CRM needs to baseline tables.

Known likely gaps:

| Current CRM need | Baseline status | Action |
|---|---|---|
| Customer status values like `ACTIVE_CUSTOMER`, `POTENTIAL_CUSTOMER`, `OTHER`, `UNASSIGNED` | `core.company.status` is generic `app.entity_status`; app-specific status may need metadata or a dedicated field. | Decide whether to add `core.company.customer_status` or store Directus CRM status in `metadata`. Prefer explicit field if it drives UI and filters. |
| Retailer domain/routing aliases | `core.company.domain` exists; routing aliases likely not first-class. | Add explicit field or metadata contract if email routing needs it. |
| Buyer/contact type and scope | `core.contact.title` and `core.contact_company.relationship_type` exist; CRM-specific `contact_type`/`scope` may be missing. | Add fields to `core.contact_company` or `crm` bridge table; do not duplicate contact. |
| CRM department category/division/active | `crm.department` baseline has `status` and metadata only. | Add explicit fields if UI filters/edits them. |
| Opportunity fields `amount`, `program_type`, `season_year`, `division`, PO/SO/hard delivery, AI fields | Baseline has `estimated_value`, `production_po_number`, `sales_order_number`, metadata. | Add explicit columns for fields used broadly; keep rare/import fields in metadata. |
| Email routing fields `routing_status`, `routing_method`, `sender`, `recipients`, detected numbers | Baseline has `status`, `direction`, `subject`, `body_preview`, `body_storage_ref`, metadata. | Add explicit routing columns or create API view that maps metadata to expected shape. |
| Meeting `participants`, `action_items`, `source`, `fireflies_transcript_id` | Baseline has `title`, `body`, `meeting_at`, external refs, metadata. | Add explicit fields or define metadata contract. |
| Notes `title`, `action_items`, source fields | Baseline `crm.note` has `body` only. | Add columns if current UI depends on them. |
| Task `body`, department/contact/opportunity relations | Baseline task has company/opportunity/assignee/title/status/due. | Add missing relations/fields. |
| Approval free-form fields `property_name`, `stage`, dates, comments | Baseline approval thread has subject/status and links. | Add free-form stage and current date/comment columns; do not convert to enum. |

Important principle:

Do not force all old Directus fields into 1:1 columns. Use explicit columns for
fields that are queried, filtered, displayed prominently, or edited. Use
`metadata` for low-value historical/import fields.

## Phase 4: API Views And RPC Contracts

The CRM frontend should not manually stitch many raw tables for every screen.
Use browser-facing `api` views/RPCs for joined, RLS-safe contracts.

Existing baseline views:

```text
api.crm_account_overview
api.global_search
```

Add new CRM contracts as needed:

| CRM screen | Recommended contract |
|---|---|
| Overview | `api.crm_account_overview`, plus `api.crm_activity_summary` or specific rollup RPCs. |
| Customers | `api.crm_account_list` |
| Contacts | `api.crm_contact_list` |
| Departments | `api.crm_department_contacts` |
| Pipeline | `api.crm_opportunity_board`, `api.crm_opportunity_list` |
| Programs | `api.crm_opportunity_list` |
| Email Routing | `api.crm_email_routing_queue` |
| Meetings | `api.crm_meeting_list` |
| Notes | `api.crm_note_list` |
| Tasks | `api.crm_task_list` |
| Approvals | `api.crm_approval_queue` |
| Settings | direct `crm.ai_model_config` or `api.crm_settings_models` |
| Command search | `api.global_search`, possibly extended |

View design requirements:

- Use `security_invoker = true`.
- Select only fields intended for browser use.
- Do not expose raw email bodies or broad raw meeting payloads.
- Do not expose `ingest.raw_record`.
- Do not expose PLM/RFQ/cost base tables.
- Include stable aliases that are convenient for frontend code.
- Keep write behavior on base tables or through RPCs, not writeable views unless deliberately designed.

RPCs are appropriate for workflow actions that require multiple writes or
security checks:

```text
api.crm_apply_email_route(...)
api.crm_create_ignore_rule_from_email(...)
api.crm_update_opportunity_stage(...)
api.crm_create_note_for_opportunity(...)
api.crm_assign_task(...)
```

If a CRM action should update PM data immediately, use a database trigger or
service-side RPC/function. Do not dual-write from browser code.

## Phase 5: Identity, Auth, App Access, And Roles

Directus users do not transfer directly.

Target identity model:

```text
auth.users
app.profile
app.role
app.user_role
app.app_access
```

Supabase Auth owns authentication. `app.profile` owns app-facing profile data.
`app.user_role` and `app.app_access` drive RLS helper functions.

Expected roles:

```text
administrator
sales
licensing
designer
viewer
vendor
```

CRM access should require either:

```sql
app.has_app_access('crm')
```

or administrator role:

```sql
app.has_role('administrator')
```

Initial behavior:

| Role | CRM access |
|---|---|
| `administrator` | Full access. |
| `sales` | CRM read/write for operational CRM tables. |
| `licensing` | CRM read/write where licensing/approval work requires it. |
| `designer` | No broad CRM writes unless explicitly approved. Read access only if business needs it. |
| `viewer` | Read-only if granted CRM app access. |
| `vendor` | No CRM access unless a future scoped requirement is designed. |

Implementation tasks:

1. Configure Microsoft/Azure provider in Supabase Auth.
2. Import/map Directus users into `app.profile`.
3. Map Directus/Entra roles into `app.role` / `app.user_role`.
4. Grant `app.app_access` rows for CRM users.
5. Decide how Entra group membership becomes Supabase role state.
6. Do not trust browser-provided role values for authorization.

If Entra remains the role hub, use a server-side sync or custom access-token hook
strategy. Do not rely on client-side role claims without RLS verification.

## Phase 6: RLS Requirements

The baseline shared-db RLS is a scaffold. Tighten and test before production.

CRM RLS requirements:

- Authenticated CRM users can read only intended CRM data.
- Sales/licensing can write only intended CRM records.
- Viewers cannot write.
- Vendors cannot read CRM data unless explicitly scoped later.
- `ingest.*` is admin/service-only.
- `core.*_source_ref` tables are admin/service-only by default.
- Raw email/meeting payloads are not exposed through broad views.
- Worker/admin RPCs require service role or explicit admin checks.
- PLM/RFQ/cost/pricing tables are not exposed to CRM users through broad grants.

Test with real Supabase users for each role:

```text
administrator
sales
licensing
viewer
vendor
```

Do not mark migration complete until role-specific reads/writes have been tested
against the preview branch.

## Phase 7: Data Migration Design

Use Directus/Postgres data as the source. Do not rely on Directus API exports as
the primary migration path.

Recommended import order:

1. Take a fresh Directus Postgres dump.
2. Load source rows into staging or `ingest.raw_record`.
3. Create source-reference rows.
4. Build canonical `core` rows.
5. Load CRM-owned `crm` rows with FKs to canonical rows.
6. Verify row counts and relationships.
7. Only then point frontend preview at the data.

Detailed sequence:

### 7.1 Source Dump

Take a fresh source dump before each rehearsal.

Source Directus database context from existing docs:

```text
Production API/Data Studio: https://data.designflow.app
Source database: Postgres 16 container directus-db-nzli85mk3luzb6u7cnq5fidu
```

Use custom-format dump where possible so restore can be inspected and replayed
selectively.

### 7.2 Raw/Staging Load

Load current Directus rows into staging/import structures before merging.

Preserve:

- Directus UUIDs
- `external_id`
- `external_source`
- source table name
- raw payload where useful
- timestamps

Use:

```text
ingest.sync_run
ingest.raw_record
core.company_source_ref
core.contact_source_ref
core.factory_source_ref
core.taxonomy_source_ref
core.sku_ref
```

### 7.3 Canonical Company/Contact Build

Companies:

- Directus `retailer`
- Directus `ingested_domains`
- PLM customers
- DAM customer/path/PO customer references

must resolve into:

```text
core.company
core.company_source_ref
```

Contacts:

- Directus `buyer`
- Directus `ingested_contact`
- future PLM contact/vendor data

must resolve into:

```text
core.contact
core.contact_company
core.contact_source_ref
```

Do not hard-merge uncertain duplicates. Use:

```text
ingest.dedupe_candidate
```

for ambiguous matches.

### 7.4 CRM-Owned Table Load

Load CRM-owned data after canonical `core` rows exist:

```text
crm.department
crm.opportunity
crm.opportunity_product
crm.email_message
crm.meeting_note
crm.ignore_rule
crm.ai_model_config
crm.note
crm.task
crm.licensor_approval_thread
```

Relationship mapping examples:

| Current Directus field | Target FK |
|---|---|
| `crm_department.retailer` | `crm.department.company_id` |
| `crm_department.primary_buyer` | `crm.department.primary_contact_id` |
| `crm_opportunity.retailer` | `crm.opportunity.company_id` |
| `crm_opportunity.contact` | `crm.opportunity.contact_id` |
| `crm_opportunity.department` | `crm.opportunity.department_id` |
| `crm_opportunity.factory` | `crm.opportunity.factory_id` |
| `crm_opportunity.project` | `crm.opportunity.project_id` |
| `crm_email_message.retailer` | `crm.email_message.company_id` |
| `crm_email_message.opportunity` | `crm.email_message.opportunity_id` |
| `crm_meeting_note.retailer` | `crm.meeting_note.company_id` |
| `crm_task.assignee` | `crm.task.assignee_profile_id` |

### 7.5 Data Reconciliation

Run reconciliation after each rehearsal:

- row count by table
- orphan FK checks
- customer count by customer status
- contact count by customer status
- department count by company
- opportunity count by stage
- email count by routing status
- latest email received timestamp
- meeting count and latest meeting timestamp
- task count by status
- approvals count
- null/free-form approval status behavior
- source-ref coverage for all imported rows

Do not proceed to frontend cutover until reconciliation is documented.

## Phase 8: Frontend Supabase Rewrite

Install Supabase client:

```bash
npm remove @directus/sdk
npm install @supabase/supabase-js
```

Add:

```text
src/lib/supabase.ts
src/lib/database.types.ts
```

Generate types from preview:

```bash
supabase gen types typescript --project-id xjcyeuvzkhtzsheknaiu > src/lib/database.types.ts
```

Do not commit `.env` with keys.

Preview frontend env:

```text
VITE_SUPABASE_URL=https://xjcyeuvzkhtzsheknaiu.supabase.co
VITE_SUPABASE_ANON_KEY=<preview anon key from approved secret store>
VITE_LOGODEV_TOKEN=<unchanged optional existing value>
```

Production frontend env after cutover:

```text
VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
VITE_SUPABASE_ANON_KEY=<production anon key from approved secret store>
VITE_LOGODEV_TOKEN=<unchanged optional existing value>
```

### 8.1 Replace `src/lib/directus.ts`

Current Directus module provides:

- `DIRECTUS_URL`
- `directus`
- `microsoftLoginUrl`
- `assetUrl`

New Supabase module should provide:

- `SUPABASE_URL`
- `supabase`
- optional `signInWithMicrosoft()` helper
- no Directus asset helper unless a temporary compatibility path is needed

Example shape:

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment configuration')
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
```

Exact implementation should match current app patterns and lint/build rules.

### 8.2 Rewrite Auth

Rewrite `src/auth/auth.tsx`.

Current Directus behavior:

- `readMe()`
- `directus.login(email, password)`
- `directus.logout()`
- session cookie mode

Target Supabase behavior:

- `supabase.auth.getSession()`
- `supabase.auth.getUser()`
- load `app.profile`
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signInWithOAuth({ provider: 'azure', options: { redirectTo } })`
- `supabase.auth.signOut()`
- subscribe to auth state changes

User object exposed to the app should preserve the fields UI expects:

```text
id
first_name or display_name parsing
last_name if available
email
avatar/avatar_url
role(s)
```

Prefer a new app profile type over pretending it is still `DirectusUser`.

### 8.3 Rewrite Login Page

Update `src/pages/LoginPage.tsx`:

- Replace `microsoftLoginUrl()` usage.
- Keep existing UI if possible.
- Microsoft button should call Supabase Azure OAuth.
- Email/password fallback should call Supabase password sign-in if still supported.
- Error copy can remain generic.

### 8.4 Rewrite CRM API Module

Rewrite `src/features/crm/api.ts` function by function. Keep exported function
names stable at first so pages/components do not all change at once.

Suggested migration order:

1. Auth/profile and app access.
2. `fetchRetailers` / `fetchIngestedDomains` / `updateRetailer`.
3. `fetchBuyers` / `fetchIngestedContacts` / `updateBuyer`.
4. `fetchDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment`.
5. `fetchOpportunities`, `setOpportunityStage`, `updateOpportunity`.
6. `fetchEmailMessages`, `updateEmailMessage`.
7. `fetchMeetingNotes`, `updateMeetingNote`.
8. `fetchIgnoreRules`, `createIgnoreRule`.
9. `fetchAiModelConfigs`, `updateAiModelConfig`.
10. `fetchNotes`, `createNote`, `updateNote`.
11. `fetchTasks`, `createTask`, `updateTask`.
12. `fetchApprovalThreads`, `updateApprovalThread`.
13. `askOpportunityAi` worker endpoint compatibility.

Use `api` views for reads where useful. Use base tables or RPCs for writes.

Example mapping:

```ts
// Directus
readItems('crm_opportunity', {
  fields: ['id', 'name', { retailer: ['id', 'name'] }],
})

// Supabase view/table approach
supabase
  .from('crm_opportunity_list') // if exposed under api and generated types allow it
  .select('*')

// Or schema-qualified direct table if needed
supabase
  .schema('crm')
  .from('opportunity')
  .select(`
    id,
    name,
    company:company_id(id, name)
  `)
```

Use the actual generated type and Supabase query syntax supported by the current
client version.

### 8.5 Preserve Loader Resilience

`CrmDataContext.load()` currently uses `Promise.allSettled`. This is intentional.

Do not regress to all-or-nothing loading.

Reason:

One bad collection/RLS issue should not blank every CRM page. A prior Directus
schema mismatch blanked the whole app when the loader used all-or-nothing logic.

Keep per-resource failure handling and useful diagnostics.

### 8.6 Types

Replace hand-maintained Directus-shaped types gradually.

Recommended pattern:

- Keep current UI/domain types temporarily.
- Add adapter functions from Supabase rows/views to UI types.
- Use generated `Database` types for Supabase query outputs.
- Avoid broad `any`.
- Do not rename all UI-facing types in the same commit as the backend switch unless necessary.

## Phase 9: CRM Worker Migration

The CRM worker currently logs into Directus and calls `/items/*`.

Port `/worksp/directus/pm-system/crm-worker.mjs` to Supabase service-role access.

Keep the worker as a Node service initially. Do not move long-running ingestion
or summarization jobs to Edge Functions yet.

Worker responsibilities:

- Outlook ingest
- Email reroute
- Fireflies webhook server
- Contact sync
- Opportunity AI summaries
- Apply ignore rules
- Opportunity chat endpoint

Preserve public endpoints:

```text
https://crm-fireflies.designflow.app/health
/s/fireflies-webhook
/s/opportunity-chat
```

Server-only env:

```text
SUPABASE_URL=https://xjcyeuvzkhtzsheknaiu.supabase.co  # preview first
SUPABASE_SERVICE_ROLE_KEY=<server-only key>
```

Never expose service-role key to browser code.

Directus helper replacement:

```js
// Current style
dx('GET', '/items/crm_email_message?...')
dx('POST', '/items/crm_email_message', body)
dx('PATCH', `/items/crm_email_message/${id}`, patch)

// Target style
supabase.from('email_message').select(...)
supabase.from('email_message').insert(...)
supabase.from('email_message').update(patch).eq('id', id)
```

If using non-public schemas with `supabase-js`, set schema correctly:

```js
supabase.schema('crm').from('email_message')
```

For complex filtering or multi-table writes, create service-role RPCs in
`shared-db` migrations.

Sensitive worker data:

- Do not expose raw email bodies broadly.
- Prefer `body_preview` / curated routing fields for browser views.
- Store raw payload references in `body_storage_ref`, `ingest.raw_record`, or service-only tables.

## Phase 10: Department/Company Integrity

Current Directus/Postgres SQL enforces that selected departments belong to the
selected customer/company.

Equivalent constraints must exist in shared-db.

Rules:

- `crm.department.company_id` is required.
- Department names should be unique per company.
- `crm.opportunity.department_id`, if set, must belong to `crm.opportunity.company_id`.
- `crm.email_message.department_id`, if introduced, must belong to its company.
- `crm.meeting_note.department_id`, if introduced, must belong to its company.
- `crm.note.department_id`, if introduced, must belong to its company.
- `crm.task.department_id`, if introduced, must belong to its company.

If these fields are in metadata or omitted in baseline, add explicit columns and
triggers before the frontend allows editing them.

Reference current SQL:

```text
/worksp/directus/pm-system/sql/enforce-crm-department-scope.sql
```

## Phase 11: Realtime

Enable realtime only for user-facing state after RLS is correct.

Baseline realtime candidates include:

```text
app.comment
app.notification
app.activity
crm.opportunity
crm.task
crm.note
crm.email_message
dam.asset
dam.style_group
```

CRM should use realtime for:

- opportunity/stage movement
- task status/assignment changes
- notes/comments/activity
- email routing status changes

Do not stream:

- raw email bodies
- raw meeting transcripts
- `ingest.*`
- queue/admin tables
- PLM/RFQ/cost base tables

Realtime is optional for the first cutover if polling/bootstrap refresh is
sufficient. Do not block core migration on realtime unless the owner explicitly
requires it.

## Phase 12: Storage

Do not migrate object storage as part of the CRM backend cutover.

CRM customer logos currently use logo.dev through `src/components/app/AccountLogo.tsx`.
There is no Directus logo file field to migrate.

Keep:

```text
VITE_LOGODEV_TOKEN
```

as-is.

DigitalOcean Spaces remains canonical for existing DAM/PM/PLM files during the
first database migration. Supabase Storage can be evaluated separately later.

## Phase 13: Preview Environment

Deploy Supabase-backed CRM to preview first.

Recommended preview URL:

```text
https://crm-dev.designflow.app
```

Preview env:

```text
VITE_SUPABASE_URL=https://xjcyeuvzkhtzsheknaiu.supabase.co
VITE_SUPABASE_ANON_KEY=<preview anon key>
VITE_LOGODEV_TOKEN=<existing optional value>
```

Production must remain Directus-backed until:

- preview schema migrations pass
- preview data import/reconciliation passes
- frontend smoke tests pass
- worker smoke tests pass
- RLS role tests pass

## Phase 14: Verification Checklist

Run verification against preview branch.

### 14.1 Build And Lint

In this repo:

```bash
npm run lint
npm run build
```

Do not add new lint warnings.

### 14.2 App Smoke Tests

Test every CRM route:

```text
Login
Overview
Pipeline
Customers
Contacts
Departments
Programs
Email Routing
Meetings
Notes
Tasks
Approvals
Settings
Command Search
Logout
```

For each page:

- page loads without full-app error
- table/board records appear
- detail drawer opens
- filters/search work
- inline edits persist where supported
- deep links still work if applicable
- empty/error states are sane

### 14.3 Data Reconciliation

Compare Directus source and Supabase preview:

```text
customers by status
contacts by segmentation bucket
departments by customer
opportunities by stage
emails by routing status
latest email received_at
meetings by source and latest date
notes count
tasks by status
approvals count
AI model config rows
ignore rule rows
orphan FK counts
source-ref coverage
```

### 14.4 RLS Tests

Use real or test Supabase Auth users for:

```text
administrator
sales
licensing
viewer
vendor
```

Verify:

- administrator can read/write expected CRM data
- sales can read/write expected CRM data
- licensing can read/write expected CRM/licensing approval data
- viewer can read but not write
- vendor cannot read CRM unless explicitly scoped
- raw ingest is not visible
- sensitive email/meeting raw payloads are not visible through broad views
- PLM cost/RFQ data is not visible through CRM views

### 14.5 Worker Tests

Against preview:

- `/health` returns 200
- Fireflies webhook can create or skip duplicate meeting note correctly
- opportunity chat endpoint answers against Supabase data
- Outlook ingest inserts `crm.email_message`
- reroute updates routing status and links
- contact sync creates/links canonical company/contact/source refs as designed
- apply ignore rules updates email status and counters
- summarize updates opportunity AI summary fields if preserved

## Phase 15: Production Promotion

Production promotion is migration-file based.

In `u2giants/shared-db`:

```bash
supabase link --project-ref qsllyeztdwjgirsysgai
scripts/check-sql.sh
supabase db push --dry-run
```

Review the dry run carefully.

For the first production promotion, production may not yet have the baseline
shared schema migrations. Expect the baseline migrations plus approved CRM
migrations unless rollout is deliberately split.

Do not proceed if dry-run includes unapproved migrations.

During approved production window:

```bash
supabase db push
supabase migration list
```

Then update production CRM env:

```text
VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
VITE_SUPABASE_ANON_KEY=<production anon key>
VITE_LOGODEV_TOKEN=<existing optional value>
```

Switch CRM worker env:

```text
SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<production service-role key>
```

## Phase 16: Cutover Order

Use this exact order unless the owner approves a different sequence.

1. Confirm preview branch tests are complete.
2. Confirm shared-db migrations are committed and reviewed.
3. Schedule a CRM write freeze.
4. Freeze Directus CRM writes.
5. Take fresh Directus Postgres dump.
6. Run final data import/delta into shared Supabase production.
7. Run reconciliation reports.
8. Apply production shared-db migrations if not already applied.
9. Deploy Supabase-backed CRM frontend.
10. Switch CRM worker to production Supabase.
11. Smoke test production login and all CRM routes.
12. Smoke test worker endpoints.
13. Monitor logs/RLS errors/query failures.
14. Keep Directus available read-only for rollback/reference.

## Phase 17: Rollback Plan

Rollback is Directus-first.

If production cutover fails:

1. Redeploy the last known Directus-backed `popcrm-web` image.
2. Restore frontend env to Directus configuration.
3. Point CRM worker back to Directus.
4. Re-enable Directus writes.
5. Keep Supabase writes for inspection; do not replay them blindly.

Avoid browser dual-writes during migration. Dual-writes make rollback and data
trust much harder.

## Phase 18: Required Handoff

Each migration session must leave a handoff note in the canonical shared-db repo:

```text
docs/app-migration-notes/popcrm-web-YYYYMMDD.md
```

Include:

- Supabase tables used by each CRM screen.
- API views used by each CRM screen.
- RPCs used by each CRM action.
- New migrations added.
- RLS policies changed.
- Realtime subscriptions used.
- Data import scripts run.
- Reconciliation results.
- Preview branch test results.
- Production promotion checklist.
- Exact production migrations to apply.
- Known gaps.
- Screens still using Directus, if any.
- Worker functionality still using Directus, if any.

Also update this CRM repo docs if frontend env/config behavior changes.

## Implementation Checklist

Use this as the working checklist.

### Shared-DB Work

- [ ] Clone/open `u2giants/shared-db`.
- [ ] Read required shared-db docs.
- [ ] Link Supabase CLI to preview `xjcyeuvzkhtzsheknaiu`.
- [ ] Audit current Directus CRM fields and worker fields.
- [ ] Compare Directus field usage to baseline shared schema.
- [ ] Add missing CRM parity fields where justified.
- [ ] Add CRM API views/RPCs.
- [ ] Add indexes for CRM query paths.
- [ ] Add department/company integrity triggers if needed.
- [ ] Tighten CRM RLS policies.
- [ ] Update realtime publication only where appropriate.
- [ ] Run `scripts/check-sql.sh`.
- [ ] Run `supabase db push --dry-run`.
- [ ] Apply migrations to preview only.
- [ ] Commit migrations and docs to shared-db.

### Data Migration Work

- [ ] Take fresh Directus dump for rehearsal.
- [ ] Load raw/staging rows into preview.
- [ ] Populate `core.*_source_ref`.
- [ ] Build canonical companies.
- [ ] Build canonical contacts and contact-company relations.
- [ ] Build canonical factories.
- [ ] Load CRM-owned tables.
- [ ] Run row-count reconciliation.
- [ ] Run FK orphan checks.
- [ ] Run source-ref coverage checks.
- [ ] Document uncertain dedupe candidates.

### CRM Frontend Work

- [ ] Remove `@directus/sdk`.
- [ ] Install `@supabase/supabase-js`.
- [ ] Add `src/lib/supabase.ts`.
- [ ] Generate `src/lib/database.types.ts` from preview.
- [ ] Rewrite auth provider.
- [ ] Rewrite login page OAuth/password flows.
- [ ] Rewrite `src/features/crm/api.ts` read functions.
- [ ] Rewrite `src/features/crm/api.ts` write functions.
- [ ] Preserve `CrmDataContext` `Promise.allSettled` resilience.
- [ ] Update types/adapters.
- [ ] Update docs/configuration env vars.
- [ ] Run lint/build.

### CRM Worker Work

- [ ] Port worker auth from Directus login to Supabase service role.
- [ ] Port Outlook ingest.
- [ ] Port reroute.
- [ ] Port Fireflies webhook.
- [ ] Port contact sync.
- [ ] Port opportunity summaries.
- [ ] Port ignore-rule application.
- [ ] Port opportunity chat.
- [ ] Test worker against preview.
- [ ] Keep service-role key server-only.

### Preview Test Work

- [ ] Deploy Supabase-backed build to `crm-dev.designflow.app`.
- [ ] Test Microsoft login.
- [ ] Test every CRM page.
- [ ] Test create/update actions.
- [ ] Test role-specific RLS.
- [ ] Test worker endpoints.
- [ ] Document preview test results in shared-db handoff.

### Production Cutover Work

- [ ] Review production `supabase db push --dry-run`.
- [ ] Approve production migration list.
- [ ] Freeze Directus writes.
- [ ] Run final import/delta.
- [ ] Run final reconciliation.
- [ ] Apply production migrations.
- [ ] Deploy Supabase-backed CRM production.
- [ ] Switch worker to production Supabase.
- [ ] Smoke test production.
- [ ] Keep Directus read-only for rollback.

## Common Mistakes To Avoid

- Do not target `bhnrhaqesgomgeuppbjp`; use shared-db target refs unless docs are updated.
- Do not create a CRM-specific Supabase project.
- Do not put permanent DDL in `popcrm-web`.
- Do not edit mirrored `shared-db/` copies in consumer repos.
- Do not run production SQL manually in Supabase dashboard.
- Do not expose `ingest.raw_record` to browser clients.
- Do not expose raw email bodies broadly.
- Do not expose PLM/RFQ/cost base tables through CRM views.
- Do not move DigitalOcean Spaces storage during this migration.
- Do not reintroduce all-or-nothing CRM bootstrap loading.
- Do not trust frontend role checks as authorization.
- Do not grant vendor CRM/product/order access before scoped rules exist.
- Do not dual-write from browser code.
- Do not hard-merge uncertain company/contact/factory/taxonomy duplicates.

## Final Definition Of Done

The CRM backend migration is done only when:

- Shared-db migrations are committed and applied to production through Supabase CLI.
- CRM data is imported into shared schemas with reconciliation documented.
- CRM frontend no longer imports or uses `@directus/sdk`.
- CRM auth uses Supabase Auth and `app.profile`.
- CRM reads use shared `core`, `crm`, `pim`, and `api` contracts.
- CRM writes are protected by RLS/RPCs.
- CRM worker writes to Supabase with service-role credentials.
- All CRM pages pass preview and production smoke tests.
- Role-specific RLS tests pass.
- Directus remains only as read-only rollback/reference during the agreed stabilization period.
