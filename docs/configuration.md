# Configuration — popcrm-web

## Frontend Environment

Optional:

```bash
VITE_DIRECTUS_URL=https://data.designflow.app
```

If omitted, `src/lib/directus.ts` defaults to `https://data.designflow.app`.

Because this is a static Vite app, `VITE_*` values are baked into the build. Rebuild and redeploy after changing them.

## Backend Requirements

Directus must allow the CRM frontend origins:

- `https://crm.designflow.app`
- `https://crm-dev.designflow.app`

Directus must support credentialed browser sessions across `.designflow.app` sibling subdomains. Backend secrets and OAuth configuration live in the `u2giants/directus` deployment, not in this frontend repo.

Do not put secrets in this repo.
