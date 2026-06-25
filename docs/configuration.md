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
# logo.dev publishable token for domain-derived account logos (client-safe).
# When unset, accounts show name-initials avatars instead.
VITE_LOGODEV_TOKEN=pk_xxxxxxxxxxxxxxxx
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required by
`src/lib/supabase.ts`; the app throws during startup if either is missing. The
anon key is public client configuration, not a service-role key.

`VITE_LOGODEV_TOKEN` is read by `src/components/app/AccountLogo.tsx`. It is a
**publishable** logo.dev key (safe to ship in client JS). Account logos are
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
receives the `administrator` role. So a brand-new staff member can sign in and
immediately see CRM data without manual seeding.

The mapping still matters when debugging: the user's `auth.users.id` is linked
from `app.profile.auth_user_id`, and the profile must have `app.app_access` for
`crm`. If one user sees empty CRM lists while service-role or admin checks show
rows, verify that profile/app-access mapping first — and confirm the
auto-provision trigger is still present on `auth.users`.

Backend secrets, service-role keys, and OAuth configuration live outside this
frontend repo. The frontend must never receive or bake a Supabase service-role
key.

Do not put secrets in this repo.
