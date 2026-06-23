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

Because this is a static Vite app, `VITE_*` values are baked into the build. Rebuild and redeploy after changing them.

## Backend Requirements

Supabase Auth must allow the CRM frontend origins:

- `https://crm.designflow.app`
- `https://crm-dev.designflow.app`

Supabase must expose the `api`, `crm`, `pim`, and `core` schemas through
PostgREST for the CRM views/RPCs used by the app.

Supabase Auth must have the Azure provider configured for staff sign-in. A
signed-in browser session is not enough by itself: the user's `auth.users.id`
must be linked from `app.profile.auth_user_id`, and the profile must have
`app.app_access` for `crm`. If one user sees empty CRM lists while service-role
or admin checks show rows, verify that profile/app-access mapping first.

Backend secrets, service-role keys, and OAuth configuration live outside this
frontend repo. The frontend must never receive or bake a Supabase service-role
key.

Do not put secrets in this repo.
