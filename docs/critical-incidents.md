# Critical incidents

Moved out of AGENTS.md. Load when investigating a regression or deploy failure.


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

