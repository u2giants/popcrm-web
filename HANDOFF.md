# Handoff — Customer / Ingested-Domain / Logo Cleanup

Date: 2026-06-28

## Current State

- `core.customer` is the intended customer hub. Active customers have
  `is_potential = false`; potential customers have `is_potential = true`.
- `crm.ingested_domain` is the intended CRM-only inbox for email-domain noise.
  It is not a customer table and must not feed customer/logo inventory until a
  human promotes a row with `crm.promote_ingested_domain(...)`.
- The frontend has local changes that narrow Data Admin Logos to customer rows
  and stop treating logo.dev as a stored full-width logo source.
- `npm run build` passed after those frontend changes.

## Open Gaps

1. **Legacy "account" API names remain.**
   - Current frontend still calls `api.crm_account_list` through helpers such as
     `useAccountSegmentQuery`.
   - Shared-db already has `api.customer_list` for shared/basic customer reads.
   - Needed: create CRM customer-named API contracts, likely
     `api.crm_customer_list` and `api.crm_update_customer`, then migrate
     frontend calls away from `crm_account_*`.

2. **Frontend internal names are still stale.**
   - Examples: `AccountsPage`, `Retailer`, `fetchRetailers`,
     `useAccountSegmentQuery`, `AccountDrawer`, `AccountRelationLogo`.
   - These are naming debt around the corrected customer/domain model.
   - Rename only after the shared-db customer-named API contract exists, to avoid
     mixing UI rename churn with backend contract changes.

3. **Stored full-width customer logos are not exposed to CRM yet.**
   - PLM import staging has `plm.customer_import.logo_url` populated from
     `customers_logo`.
   - `api.crm_account_list` does not expose `logo_url`.
   - Needed: shared-db migration should expose a stable customer logo field,
     preferably through the new CRM customer view. Frontend `Retailer.logo_url`
     and `AccountLogo variant="full"` are already prepared for that field.

4. **Shared-db docs are uneven.**
   - `docs/shared-database-vision.md` has the correct model and now includes the
     logo contract.
   - Some older shared-db docs/migrations still mention `core.company`,
     `account`, or old CRM migration assumptions. Applied migrations should not
     be edited, but docs should be cleaned where they are not historical records.

5. **Do not use "all accounts" as a customer proxy.**
   - The Data Admin Logos tab previously used the broad legacy account segment
     and showed ~3,777 rows.
   - It now uses active/potential customer rows only.
   - Future customer/logo screens should not use the broad `all` segment unless
     the UI explicitly means all customer-status buckets, not ingested domains.

## Shared-db Status

- `/worksp/shared-db` was inspected because this work requires backend contract
  changes.
- Existing dirty file before migration work: `AGENTS.md`.
- This session also edited `docs/shared-database-vision.md`.
- No shared-db migration has been created yet.
- Next exact shared-db action: after resolving/acknowledging the unrelated
  `AGENTS.md` change, create a dedicated shared-db branch and migration for
  CRM customer-named API contracts plus stored logo exposure.

## App Repo Status

Local modified files at handoff time:

- `AGENTS.md`
- `docs/architecture.md`
- `src/components/app/AccountLogo.tsx`
- `src/features/crm/api.ts`
- `src/features/crm/components/AccountRelationLogo.tsx`
- `src/features/crm/pages/DataAdminPage.tsx`
- `src/lib/types.ts`

Run before committing:

```bash
npm run build
git status --short
```
