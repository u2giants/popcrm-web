# HANDOFF — popcrm-web

Continuation context for unfinished/partially-deployed work. Delete this file
once the item below is truly complete. See `AGENTS.md` for the full operating guide.

## Contact relationship clear RPC

Status:
partial — frontend is backward-compatible and safe to deploy, but the new clear
behavior depends on a shared-db migration that still needs to be applied through
the shared database workflow.

Done:
- Added app-repo copy of
  `shared-db/supabase/migrations/20260623024500_crm_update_contact_clear_relationship_fields.sql`.
- Added canonical `/worksp/shared-db/supabase/migrations/20260623024500_crm_update_contact_clear_relationship_fields.sql`.
- Updated `src/features/crm/api.ts` so `updateBuyer` sends explicit `p_clear_*`
  flags and retries the old RPC argument shape if production has not applied the
  new function signature yet.
- Updated Contacts/Data Admin so relationship-owned contact edits send account
  context, and department selection can infer the account when the row was
  previously unassigned.
- `npm run lint`, `npm run build`, and `/worksp/shared-db/scripts/check-sql.sh`
  static checks passed.

Next action:
1. In canonical `u2giants/shared-db`, review and land migration
   `20260623024500_crm_update_contact_clear_relationship_fields.sql` using the
   shared-db branch/PR workflow.
2. Apply/promote it to production only after the shared-db preview/verification
   checklist passes.
3. After production has the new `api.crm_update_contact` signature, verify:
   clearing Contact Type in Data Admin persists after refetch, clearing a
   Department persists, and changing a contact's Account updates the segmented
   Contacts counts correctly.
4. Once verified, this `HANDOFF.md` can be deleted.

Risks / watchouts:
- Do not remove the old-RPC fallback in `updateBuyer` until production definitely
  has the new function signature.
- `core.contact_company.company_id` is required; relationship-owned contact
  fields must be updated against a specific account relationship row.
- Passing `null` alone is not a reliable clear operation for this RPC contract;
  use the explicit `p_clear_*` flags.

## CRM ingested-domain schema follow-up

Status:
app implementation complete; two external/manual follow-ups remain.

Done in `popcrm-web`:
- Regenerated `src/lib/database.types.ts` from preview project
  `xjcyeuvzkhtzsheknaiu`.
- Split Accounts Triage from account rows: Triage now reads
  `api.crm_ingested_domain_list` as `CrmIngestedDomain[]`.
- Added ingested-domain count, realtime invalidation, and
  `usePromoteIngestedDomainMutation()` for `crm.promote_ingested_domain`.
- Updated Accounts Triage to render domain-specific columns/actions instead of
  account-only inline edits/drawer.
- Added a separate `is_potential` source chip for accounts.
- Updated `AGENTS.md` and `docs/architecture.md`.
- `npm run build`, `npm run lint`, and `git diff --check` passed.

Next action:
1. Flag whoever owns the external email/Fireflies ingestion worker
   (`crm-fireflies.designflow.app`, deployed from `u2giants/directus`) that it
   must call `crm.record_ingested_domain(p_domain, p_sender, p_subject,
   p_display_name)` instead of inserting email-domain noise into
   `core.customer`.
2. Verify on preview with `.env` pointed at Supabase preview project
   `xjcyeuvzkhtzsheknaiu`:
   - Accounts -> Customers loads from `api.crm_account_list`.
   - Accounts -> Triage loads rows from `api.crm_ingested_domain_list`.
   - Promoting a triaged domain creates a potential customer and removes the
     domain from Triage after refetch.
   - Editing an account status/chain still persists through
     `api.crm_update_account`.

Risks / watchouts:
- This app did not require any shared-db object changes. If a future issue shows
  that the browser cannot call `crm.promote_ingested_domain` directly, add a
  wrapper such as `api.crm_promote_ingested_domain` in canonical
  `u2giants/shared-db` and document that DB change in the correct shared-db
  `.md` file.
- Do not edit this repo's vendored `shared-db/` mirror.
