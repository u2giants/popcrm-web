# Handoff — Remove Legacy Account Naming

Date: 2026-06-28

## Current State

- The app repo is on `main`.
- The shared-db repo is on `codex/crm-customer-contracts`.
- Detailed tracker: `fix_remove_account.md`.
- Shared-db commit/PR: `fed2573`, https://github.com/u2giants/shared-db/pull/19
- App commit: this app commit (local `main`, not pushed because migration is not yet
  applied to the target schema).
- Active app code has been moved from account-named CRM contracts/symbols to
  customer-named ones.
- `/customers` is canonical. `/accounts` remains only as a legacy bookmark
  redirect to `/customers`.

## Shared-DB Work

- Migration created:
  `/worksp/shared-db/supabase/migrations/20260628165000_crm_customer_contracts.sql`
- It adds:
  - `api.crm_customer_list`
  - `api.crm_customer_overview`
  - `api.crm_update_customer(p_customer_id uuid, ...)`
- It keeps legacy `api.crm_account_list`, `api.crm_account_overview`, and
  `api.crm_update_account` alive with deprecation comments.
- Preview status: not applied by this session.
- Production status: applied on 2026-06-28 to linked project
  `qsllyeztdwjgirsysgai`.
- Production verification: both new and legacy list/overview views returned
  3,777 rows; `api.crm_update_customer` exists; legacy view comments mark old
  account names as deprecated compatibility names.
- Existing unrelated dirty file in `/worksp/shared-db`: `AGENTS.md`. Do not stage
  it with this migration unless the owner explicitly asks.

## App Work

Renamed/migrated:

- `AccountsPage` -> `CustomersPage`
- `AccountDrawer` -> `CustomerDrawer`
- `AccountLogo` -> `CustomerLogo`
- `AccountRelationLogo` -> `CustomerRelationLogo`
- `AccountSegment*` / `accountSegment*` -> `CustomerSegment*` /
  `customerSegment*`
- app reads/writes from `crm_account_*` / `crm_update_account` to
  `crm_customer_*` / `crm_update_customer`

`src/lib/database.types.ts` was regenerated from production after the migration
was applied. Because the migration is additive, it includes both new
`crm_customer_*` contracts and old `crm_account_*` compatibility contracts.

## Exact Next Actions

1. Push/deploy the local CRM app commit once you are ready for the frontend to
   start calling `crm_customer_*`.
2. Run:

   ```bash
   cd /worksp/popcrm-web
   npm run build
   node --check workers/crm-worker-supabase.mjs
   rg "crm_account|crm_update_account|accountSegment|AccountSegment|AccountDrawer|AccountLogo|AccountRelationLogo|AccountsPage" src
   ```

3. Commit shared-db changes on `codex/crm-customer-contracts` without staging the
   unrelated shared-db `AGENTS.md`.
4. Commit app changes on `main`.
5. After production app deploy is verified, create the final shared-db migration
   that drops/revokes the legacy account-named compatibility contracts.

## Allowed Remaining Account References

- `/worksp/popcrm-web/src/app/routes.tsx`: `/accounts` redirect and comment.
- `/worksp/popcrm-web/src/lib/database.types.ts`: real database column
  `account_owner_profile_id`.
- `/worksp/shared-db`: historical migrations, deprecated compatibility objects,
  `core.company_source_ref`, and existing `company_id` columns.
