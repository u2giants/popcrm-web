# Configuration — popcrm-web

Infrastructure/server ownership notes are mirrored in
[`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure).
If a config change affects deployment, runtime ownership, domains, or server
operations, update that shared reference too.

## Frontend Environment

Optional:

```bash
VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
# logo.dev publishable token for domain-derived customer logos (client-safe).
# When unset, customers show name-initials avatars instead.
VITE_LOGODEV_TOKEN=pk_xxxxxxxxxxxxxxxx
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required by
`src/lib/supabase.ts`; the app throws during startup if either is missing. The
anon key is public client configuration, not a service-role key.

`VITE_LOGODEV_TOKEN` is read by `src/components/app/CustomerLogo.tsx`. It is a
**publishable** logo.dev key (safe to ship in client JS). Customer logos are
fetched from `img.logo.dev` keyed on each retailer's `domain`, with a graceful
fallback to the initials avatar when there is no domain, no token, or the image
fails to load. In production it is supplied via the GitHub Actions secret
`LOGODEV_TOKEN`, passed as a Docker build-arg in `.github/workflows/deploy.yml`.
The 1Password source of truth is
`op://vibe_coding/logo.dev publishable token - popcrm-web/password`; the item
notes include rotation, verification, and future-AI guidance. Do not put the
token value itself in repo docs.

Because this is a static Vite app, `VITE_*` values are baked into the build. Rebuild and redeploy after changing them.

## Backend Requirements

Supabase Auth must allow the CRM frontend origins:

- `https://crm.designflow.app`
- `https://crm-dev.designflow.app`

The shared Supabase Auth project also serves PM, DAM, SG, and master-data apps. Its `site_url` is `https://crm.designflow.app`, which is expected, but every sibling frontend must pass an explicit `redirectTo` and be present in the project's `uri_allow_list`; otherwise OAuth may fall back to CRM after the provider callback. Keep at least these production/preview app origins in the allowlist:

- `https://crm.designflow.app`, `https://crm-dev.designflow.app`
- `https://pm.designflow.app`, `https://pm-dev.designflow.app`, `https://pm-ci.designflow.app`
- `https://dam.designflow.app`, `https://sg.designflow.app`
- `https://master.designflow.app`

For each app origin include the bare origin, trailing-slash origin, and `/**` wildcard form.

Supabase must expose the `api`, `crm`, `pim`, and `core` schemas through
PostgREST for the CRM views/RPCs used by the app.

Supabase Auth has the Azure (Microsoft) provider configured for staff sign-in.
The production app registration is **"POP CRM — Supabase Auth"** (callback
`https://qsllyeztdwjgirsysgai.supabase.co/auth/v1/callback`); its identifiers and
setup are recorded in `shared-db/docs/app-migration-notes/popcrm-web-production-cutover-20260621.md`.
The client secret lives only in the Supabase Auth config and Azure — never in
this repo.

Profile provisioning is automatic. A shared-db trigger
(`app.handle_new_auth_user` on `auth.users` insert, migration
`20260621162220_crm_auth_provision.sql`) creates `app.profile` and grants
`app.app_access('crm')` on a user's **first** SSO login; the owner email also
receives the `administrator` role. Migration
`20260703172500_fix_crm_auth_profile_email_link.sql` also makes that trigger
link an existing pre-seeded `app.profile` by email before inserting a new
profile, avoiding `app.profile.email` uniqueness failures for imported staff
profiles. Migration
`20260703220000_fix_crm_auth_profile_mismatched_email_relink.sql` covers the
related stale-link case where a CRM profile email is already attached to an
older Auth user with a different email. So a brand-new staff member can sign in
and immediately see CRM data without manual seeding, and an imported staff
profile can be linked or relinked on first SSO login.

The mapping still matters when debugging: the user's `auth.users.id` is linked
from `app.profile.auth_user_id`, and the profile must have `app.app_access` for
`crm`. If one user sees empty CRM lists while service-role or admin checks show
rows, verify that profile/app-access mapping first — and confirm the
auto-provision trigger is still present on `auth.users`. If Microsoft SSO
returns to the app with `error_description=Database error saving new user`, check
for a pre-seeded `app.profile.email` row with a missing `auth_user_id` or an
`auth_user_id` whose `auth.users.email` differs from the profile email, and
verify that both email-link migrations are applied in the shared Supabase
project.

Backend secrets, service-role keys, and OAuth configuration live outside this
frontend repo. The frontend must never receive or bake a Supabase service-role
key.

Do not put secrets in this repo.

## Host Worker Environment

The host workers read mode-600 `/home/ai/.crm-worker.env`; their documented
1Password item is
`POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env` in the
`vibe_coding` vault. Secret values must never be copied into this repository or
browser configuration.

All worker commands require non-blank `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. The always-on `fireflies-server` additionally
requires:

- `FIREFLIES_WEBHOOK_SECRET` to authenticate webhook bodies;
- `FIREFLIES_API_KEY` to retrieve Fireflies transcripts; and
- `OPENROUTER_API_KEY` for the enabled Opportunity Chat endpoint.

These requirements are checked before the HTTP server opens its listening
port. A missing or whitespace-only value therefore stops startup with a
non-zero exit instead of weakening authentication or leaving a partially
working public service.

The public worker routes also bound their JSON request bodies before
authentication, signature verification, database reads, or paid AI calls:

- `OPPORTUNITY_CHAT_MAX_BODY_BYTES` defaults to `65536` (64 KiB).
- `FIREFLIES_MAX_BODY_BYTES` defaults to `1048576` (1 MiB).

Overrides must be positive whole-byte integers. Missing values use the defaults;
zero, negative, fractional, whitespace-padded, nonnumeric, or unsafe integer
values stop `fireflies-server` before it listens. Oversized requests receive
HTTP 413 `payload_too_large`; malformed JSON receives HTTP 400 `invalid_json`.
Do not raise these limits without evidence from a legitimate rejected payload.
Fireflies authentication continues to cover the exact raw bytes received, not
a parsed or re-serialized JSON representation.

All Microsoft Graph, OpenRouter, and Fireflies API calls have hard network
deadlines. Optional worker overrides are:

- `GRAPH_FETCH_TIMEOUT_MS` defaults to `30000`.
- `OPENROUTER_FETCH_TIMEOUT_MS` defaults to `60000`.
- `FIREFLIES_FETCH_TIMEOUT_MS` defaults to `30000`.
- `UPSTREAM_MAX_ATTEMPTS` defaults to `3` for safe transient retries.
- `UPSTREAM_RETRY_BASE_DELAY_MS` defaults to `250`.
- `UPSTREAM_RETRY_MAX_DELAY_MS` defaults to `2000` and must not be below the
  base delay.

Every override must be a positive whole-number count of milliseconds or
attempts. Invalid values stop the worker before it makes an upstream request.
Retries apply only to safe Graph token/message reads and Fireflies transcript
queries after timeouts, network resets, HTTP 408/429, or selected 5xx replies.
OpenRouter requests have a deadline but are never retried automatically because
resending a paid AI request could create duplicate cost or work. Failure logs
name the operation, attempt count, and safe HTTP status without response bodies,
tokens, or CRM content.

Fireflies Webhooks V2 is the production integration. Configure the endpoint
`https://crm-fireflies.designflow.app/s/fireflies-webhook` for only the
`meeting.transcribed` event and set its signing secret to the same
`FIREFLIES_WEBHOOK_SECRET` stored in the named 1Password item and host
environment. The worker accepts V2's `event`, `meeting_id`, and `timestamp`
payload fields and `sha256=<hex>` signature. It temporarily retains legacy V1
payload and plain-hex signature compatibility for migration.
After signature and payload validation, it returns `202 Accepted` before doing
transcript retrieval, routing, and database writes so the sender receives a
2xx acknowledgement within its 10-second deadline.

As verified on 2026-07-27, `FIREFLIES_WEBHOOK_SECRET` is present in the named
1Password item, `/home/ai/.crm-worker.env`, and the Fireflies Webhooks V2
integration. The production dashboard test delivery returned HTTP 200.
