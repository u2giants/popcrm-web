# Configuration — popcrm-web

## Frontend Environment

Optional:

```bash
VITE_DIRECTUS_URL=https://data.designflow.app
# logo.dev publishable token for domain-derived account logos (client-safe).
# When unset, accounts show name-initials avatars instead.
VITE_LOGODEV_TOKEN=pk_xxxxxxxxxxxxxxxx
```

If `VITE_DIRECTUS_URL` is omitted, `src/lib/directus.ts` defaults to `https://data.designflow.app`.

`VITE_LOGODEV_TOKEN` is read by `src/components/app/AccountLogo.tsx`. It is a
**publishable** logo.dev key (safe to ship in client JS). Account logos are
fetched from `img.logo.dev` keyed on each retailer's `domain`, with a graceful
fallback to the initials avatar when there is no domain, no token, or the image
fails to load. In production it is supplied via the GitHub Actions secret
`LOGODEV_TOKEN`, passed as a Docker build-arg in `.github/workflows/deploy.yml`.

Because this is a static Vite app, `VITE_*` values are baked into the build. Rebuild and redeploy after changing them.

## Backend Requirements

Directus must allow the CRM frontend origins:

- `https://crm.designflow.app`
- `https://crm-dev.designflow.app`

Directus must support credentialed browser sessions across `.designflow.app` sibling subdomains. Backend secrets and OAuth configuration live in the `u2giants/directus` deployment, not in this frontend repo.

Do not put secrets in this repo.
