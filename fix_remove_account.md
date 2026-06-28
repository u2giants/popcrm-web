# Remove Legacy Account Naming

Date: 2026-06-28

## Goal

Eliminate active `account` naming from POP CRM customer contracts and app code
without breaking deployed clients. The rollout is intentionally two-step:

1. Add customer-named API/RPC/view contracts while legacy account-named contracts
   remain alive.
2. Move active app code to customer-named contracts and symbols.
3. After production is verified on the customer-named contracts, add a final
   shared-db migration that drops or revokes the deprecated account-named
   compatibility objects.

## What The Owner Needs To Approve

You do not need to review code. The only thing needed from you is plain-English
approval for the rollout window:

1. **Apply the shared-db migration to preview.**
   - Safe intent: add new customer-named API objects, keep old account-named
     objects alive.
   - AI can do this and verify row counts.
2. **Apply the same migration to production.**
   - Safe intent: still additive; no old object is removed yet.
   - After this, CRM can safely deploy code that calls the new names.
3. **Push/deploy the CRM app commit.**
   - This changes the frontend to use `crm_customer_*`.
   - AI should smoke-test `/customers`, `/accounts`, Email Routing, Contacts,
     Global Search, and inline customer edits after deploy.
4. **Later, approve final removal of legacy names.**
   - This is the only dangerous step because it drops/revokes old
     `crm_account_*` compatibility objects.
   - Do this only after CRM/PM/DAM scans show no active callers.

If you say "go ahead with the preview migration" or "go ahead with production,"
that is enough for an AI session to continue from this file.

## Repositories

- App: `/worksp/popcrm-web`
- Canonical schema: `/worksp/shared-db`
- Do not edit `/worksp/popcrm-web/shared-db`; it is only a mirror.

Sibling app audit docs:

- PM/PIM: `/worksp/poppim-web/fix_remove_account.md`
- DAM/PopSG current app: `/worksp/popdam3/fix_remove_account.md`
- DAM legacy/alternate checkout: `/worksp/popdam/fix_remove_account.md`
- Shared database/PLM status: `/worksp/shared-db/docs/crm-customer-contract-rollout.md`

## Shared-DB Status

- Branch: `codex/crm-customer-contracts`
- Commit: `fed2573` (`Add CRM customer API contracts`)
- GitHub PR: `https://github.com/u2giants/shared-db/pull/19`
- Migration: `supabase/migrations/20260628165000_crm_customer_contracts.sql`
- Preview migration status: not applied by this session
- Production migration status: applied on 2026-06-28 with
  `supabase db push` against linked project `qsllyeztdwjgirsysgai`
- Production verification:
  - `api.crm_customer_list`: 3,777 rows
  - `api.crm_account_list`: 3,777 rows
  - `api.crm_customer_overview`: 3,777 rows
  - `api.crm_account_overview`: 3,777 rows
  - `api.crm_update_customer`: exists
  - Legacy view comments mark `crm_account_*` as deprecated compatibility names
- Unrelated dirty file observed before this work: `/worksp/shared-db/AGENTS.md`
  (do not stage as part of this change)

The migration adds:

- `api.crm_customer_list`
- `api.crm_customer_overview`
- `api.crm_update_customer(p_customer_id uuid, ...)`
- grants matching the legacy CRM account contracts
- deprecation comments on `api.crm_account_list`,
  `api.crm_account_overview`, and `api.crm_update_account`

It does not drop or revoke legacy `api.crm_account_*` objects.

## App Status

Active app code has moved to customer-named contracts and symbols:

- Commit: this app commit (`Use customer-named CRM contracts`)
- Push status: not pushed to `origin/main` by this session because the
  customer-named DB contracts have not been applied to the target schema yet.

- `crm_account_list` -> `crm_customer_list`
- `crm_account_overview` -> `crm_customer_overview`
- `crm_update_account` -> `crm_update_customer`
- `AccountSegment` -> `CustomerSegment`
- `fetchAccountSegment*` -> `fetchCustomerSegment*`
- `accountSegment*` query keys -> `customerSegment*`
- `useAccountSegment*` -> `useCustomerSegment*`
- `useUpdateAccountMutation` -> `useUpdateCustomerMutation`
- `AccountsPage.tsx` -> `CustomersPage.tsx`
- `AccountDrawer.tsx` -> `CustomerDrawer.tsx`
- `AccountLogo.tsx` -> `CustomerLogo.tsx`
- `AccountRelationLogo.tsx` -> `CustomerRelationLogo.tsx`

`/customers` remains canonical. `/accounts` remains only as a legacy bookmark
redirect to `/customers`.

## Remaining Account References

Allowed after this phase:

- `/worksp/popcrm-web/src/app/routes.tsx`
  - `/accounts` redirect and its compatibility comment.
- `/worksp/popcrm-web/src/lib/database.types.ts`
  - `account_owner_profile_id` is a real database column name.
- `/worksp/shared-db`
  - historical migrations and deprecated compatibility objects
    `api.crm_account_list`, `api.crm_account_overview`,
    `api.crm_update_account`.
  - `core.company_source_ref` and `company_id` columns are intentionally still
    named that way to limit backend churn.

Anything else found by `rg "crm_account|crm_update_account|accountSegment|AccountSegment|AccountDrawer|AccountLogo|AccountRelationLogo|AccountsPage" src`
should be treated as a regression unless it is the explicit `/accounts` route
compatibility comment.

## Verification Commands

Run in `/worksp/popcrm-web`:

```bash
npm run build
node --check workers/crm-worker-supabase.mjs
rg "crm_account|crm_update_account|accountSegment|AccountSegment|AccountDrawer|AccountLogo|AccountRelationLogo|AccountsPage" src
```

Run after applying the shared-db migration to the target schema:

```sql
select count(*) from api.crm_customer_list;
select count(*) from api.crm_account_list;
select count(*) from api.crm_customer_overview;
select count(*) from api.crm_account_overview;
```

Also verify authenticated REST access to `api.crm_customer_list` and execution of
`api.crm_update_customer`.

App database types were regenerated from production after the migration was
applied. Because the migration is additive, generated types correctly include
both new `crm_customer_*` contracts and old `crm_account_*` compatibility
contracts.

## Manual Smoke Checks

- `/customers` loads.
- `/accounts` redirects to `/customers`.
- Customer status and chain inline edits persist.
- Contacts customer dropdowns work.
- Email Routing customer picker loads active/potential customers only.
- Meetings, Departments, Programs, Notes render customer names/logos.
- Global search links to `/customers`.
- Email Routing loads newest emails quickly.

## Final Compatibility Removal

Only after production app deploy is verified:

1. Add a second `/worksp/shared-db` migration that drops or revokes:
   - `api.crm_account_list`
   - `api.crm_account_overview`
   - `api.crm_update_account`
2. Regenerate app database types again.
3. Run all tests and smoke checks again.
4. Update this file and remove `HANDOFF.md` only when no unfinished work remains.
