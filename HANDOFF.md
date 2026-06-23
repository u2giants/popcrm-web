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
