# popcrm-web Supabase Migration — Session Handoff (2026-06-21)

CRM (`u2giants/popcrm-web`) migrated from the Directus backend to the shared
Supabase project. This note began as the 2026-06-21 preview handoff; production
was later reconciled on 2026-06-22 (see updates below).

## New migrations (this PR)

| File | Purpose |
|---|---|
| `20260621110000_crm_parity_fields.sql` | Adds the explicit columns the CRM UI/worker use onto `core.company`, `core.contact_company`, and `crm.*` (customer_status, chain_type, routing_aliases/so_patterns, opportunity program/season/division/incoterms/AI fields, email routing fields, meeting/note/task/approval fields, etc.). Additive + nullable. |
| `20260621110100_crm_integrity_triggers.sql` | Department-belongs-to-company enforcement (parity with Directus `enforce-crm-department-scope.sql`) on opportunity/email/meeting/note/task and `core.contact_company`. |
| `20260621110200_crm_api_views.sql` | `security_invoker` browser views, one per screen (see table below). No raw email bodies / transcripts / ingest payloads. |
| `20260621110300_crm_api_rpcs.sql` | `current_user_profile()` identity contract; guarded `crm_update_account` / `crm_update_contact` (core writes) and `crm_set_opportunity_stage`. |
| `20260621110400_crm_rls_realtime.sql` | `profile_select_staff` policy (assignee/owner display); realtime for meeting_note/department/approval; **exposes `api, crm, pim, core` schemas to PostgREST**. |
| `20260622033500_crm_contact_view_access_gate.sql` | Recreates `api.crm_contact_list` as `security_invoker=false` with an explicit `app.has_app_access('crm')` guard to avoid PostgREST/RLS timeout during paged contact loads. |

Validated by applying the full chain (4 baseline + these 5) to a throwaway
Postgres 15 with Supabase auth stubs: all apply cleanly; integrity trigger,
views, and RPC guards verified functionally.

## Tables / views / RPCs per CRM screen

| Screen | Reads | Writes |
|---|---|---|
| Overview | `api.crm_account_overview`, derived from the lists below | — |
| Accounts (triage) | `api.crm_account_list` (all companies) | `api.crm_update_account` RPC |
| Accounts pickers (customers) | `api.crm_account_list` filtered `customer_status in (ACTIVE_CUSTOMER, POTENTIAL_CUSTOMER)` | — |
| Contacts | `api.crm_contact_list` | `api.crm_update_contact` RPC |
| Departments | `api.crm_department_list` | `crm.department` (direct) |
| Pipeline / Programs | `api.crm_opportunity_list` | `crm.opportunity` (direct), `api.crm_set_opportunity_stage` |
| Email Routing | `api.crm_email_routing_queue` | `crm.email_message` (direct), `crm.ignore_rule` |
| Meetings | `api.crm_meeting_list` | `crm.meeting_note` |
| Notes | `api.crm_note_list` | `crm.note` |
| Tasks | `api.crm_task_list` | `crm.task` |
| Approvals | `api.crm_approval_queue` | `crm.licensor_approval_thread` |
| Settings | `api.crm_ai_model_config_list`, `api.crm_ignore_rule_list` | `crm.ai_model_config` |
| Auth | `api.current_user_profile()` RPC | Supabase Auth (Azure OAuth + password) |

The "curated customers vs full ingested registry" split (Directus
`retailer`/`buyer` vs `ingested_domains`/`ingested_contact`) is collapsed to one
`core.company`/`core.contact`, filtered by `customer_status` in the frontend.

## RLS changes

- `app.profile`: added `profile_select_staff` (any role can read profiles) so the
  CRM can display assignee/owner/salesperson names under `security_invoker` views.
- Account/contact writes go through `security definer` RPCs guarded by
  `app.has_app_access('crm')`, so baseline `core` admin-only write RLS stays intact.
- `crm.*` writes rely on the existing baseline `crm_write` policy (sales/licensing/admin).

## Realtime

Baseline already publishes `crm.opportunity/task/note/email_message`. Added
`crm.meeting_note`, `crm.department`, `crm.licensor_approval_thread`.

## Frontend (popcrm-web, committed in that repo)

- Removed `@directus/sdk`; added `@supabase/supabase-js`.
- New `src/lib/supabase.ts`; generated `src/lib/database.types.ts` (from the
  validated local schema — regenerate from preview once reachable).
- Rewrote `src/auth/auth.tsx` (Supabase Auth + `current_user_profile`),
  `src/pages/LoginPage.tsx` (Azure OAuth), `src/features/crm/api.ts` (api views +
  adapters + mapped writes), `src/lib/types.ts` (`AppUser`).
- `CrmDataContext` `Promise.allSettled` resilience preserved.
- `npm run build` passes; `npm run lint` 0 errors, 0 new warnings.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LOGODEV_TOKEN`.

## Worker

`/worksp/directus/pm-system/crm-worker-supabase.mjs` — full Supabase service-role
port (outlook-ingest, reroute, fireflies-server, contact-sync, summarize,
apply-ignore-rules); endpoints `/health`, `/s/fireflies-webhook`,
`/s/opportunity-chat` preserved (chat now verifies a Supabase JWT Bearer token).
The original Directus `crm-worker.mjs` is kept for rollback. Worker runtime needs
`npm i @supabase/supabase-js` and `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

## Data migration / reconciliation

Completed against production Supabase on 2026-06-22.

Verified source/target reconciliation:

- company source refs: `3846/3846`; canonical companies: `3744`
- contact source refs: `9401/9401`; canonical contacts: `8654`
- departments: `38/38`
- emails: `11267/11267` (included 1 missing `crm.email_message` insert:
  `e6850651-289f-4adf-a71a-aafe5fd08620`)
- meetings: `27/27`
- zero-count CRM tables matched their Directus source counts
- remaining contact relationships were reconciled by upserting 743 `buyer`
  relationship rows into `core.contact_company`

Contacts page segment counts after reconciliation and the view fix:

- Cust Contacts: `690`
- Dept. Contacts: `57`
- Triage: `7907`
- All: `8654`

Identity/access caveat found during reconciliation: a Supabase Auth user can sign
in while still seeing empty CRM lists if their `auth.users.id` is not linked from
`app.profile.auth_user_id` or if `app.app_access` lacks `crm`.

## 2026-06-22 Contacts view timeout fix

What changed:
`api.crm_contact_list` was recreated by
`20260622033500_crm_contact_view_access_gate.sql` with
`security_invoker=false` and an explicit `app.has_app_access('crm')` predicate.
The frontend also stopped applying server-side PostgREST ordering/filtering for
the Contacts bootstrap path.

Why:
The original `security_invoker` contact view timed out on the browser's third
1,000-row page when PostgREST applied ordering/filtering on derived fields such
as `name` and `company_customer_status`. `CrmDataContext` then loaded contacts as
empty, making `/contacts` show zeroes even though 8,654 contacts were present.

Future sessions should:
Keep Contacts bootstrap reads unfiltered/unordered and segment/sort client-side.
When debugging "zero contacts", verify authenticated REST pages across the full
range (`0-999`, `1000-1999`, `2000-2999`, etc.) and the user's
profile/app-access mapping before rerunning imports.

## 2026-06-22 Live-query refactor cap regression

What changed:
The TanStack Query refactor initially added hard-coded limits to page hooks
before server-side pagination/search/count contracts existed. Accounts loaded
only 100 companies, Email Routing 50 messages, Pipeline/Programs 100
opportunities, Notes 50, Tasks 100, and related drawers/global search used the
same partial datasets.

Why:
The refactor moved loading from one global bootstrap to page-scoped hooks, but a
bounded client-side dataset was still rendered as if it were the full table. The
database import was intact; the UI was asking for too little data.

Future sessions should:
Do not add positive limits to CRM list hooks unless the view/RPC also supports
server-side search/filtering/pagination and returns true total/segment counts.
Until then, use full paged reads (`limit = -1`) or explicit full segment reads.
Contacts and Accounts may load heavy secondary segments on demand, but their tab
counts must come from real count queries or full segment data.

## Preview test results

Not run: the preview branch DB (`tcscehehgeiijilylezv`) is IPv6-only and was
unreachable from the migration environment (`ECONNREFUSED`) via both the Supabase
CLI and the management API, and no preview DB password was available. SQL was
instead validated on a local Postgres 15 (see above).

## Production promotion checklist (historical)

This was the original 2026-06-21 checklist. Production has since been promoted
and reconciled; keep the order for fresh environments or rollback/replay audits.

Apply in this order, preview first then production, via `supabase db push`:

```text
20260621000100_foundation.sql              (baseline — if not already on target)
20260621000200_app_core.sql                (baseline)
20260621000300_domain_tables.sql           (baseline)
20260621000400_api_rls_realtime.sql        (baseline)
20260621110000_crm_parity_fields.sql       (this PR)
20260621110100_crm_integrity_triggers.sql  (this PR)
20260621110200_crm_api_views.sql           (this PR)
20260621110300_crm_api_rpcs.sql            (this PR)
20260621110400_crm_rls_realtime.sql        (this PR)
20260622033500_crm_contact_view_access_gate.sql
```

## Known gaps

- **Preview parity**: if the preview branch is used again, apply the production
  migration chain there, regenerate `database.types.ts`, set preview env vars,
  and load seed/production-like CRM data before smoke testing.
- **Identity provisioning**: new CRM users still need `app.profile` /
  `app.user_role` / `app.app_access` mapping. Without a provisioned CRM profile a
  signed-in user has no CRM access and lists come back empty.
- **Role-based RLS tests**: broader per-role coverage is still needed beyond the
  authenticated/admin spot checks from the production fix.
- `crm.note.opportunity_id` is `on delete cascade` (baseline) and `crm.note` has no `factory`; meeting attendees have no shared table (stored in `meeting_note.metadata`).
- RPC `coalesce` semantics mean passing `null` does not clear a contact field (edge case).
- No CRM screen or worker command still depends on Directus; the Directus worker/backend remain only as read-only rollback.
