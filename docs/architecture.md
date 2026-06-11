# Architecture — popcrm-web

`popcrm-web` is a static React SPA for POP CRM.

```txt
Browser
  -> https://crm.designflow.app
  -> popcrm-web nginx container
  -> React/Vite SPA
  -> Directus SDK
  -> https://data.designflow.app
  -> Directus/Postgres shared backend
```

Fireflies integration is handled by a separate worker endpoint:

```txt
Fireflies
  -> https://crm-fireflies.designflow.app/s/fireflies-webhook
  -> popcrm-fireflies container
  -> Directus CRM collections
```

The frontend has no database and stores no CRM data locally. It uses browser session authentication against Directus.

Important frontend modules:

- `src/auth/auth.tsx`: session/user state.
- `src/lib/directus.ts`: Directus client.
- `src/lib/types.ts`: frontend schema types.
- `src/features/crm/api.ts`: CRM API functions.
- `src/features/crm/CrmPage.tsx`: current CRM workbench.

The planned frontend redesign is documented in `frontend_imp.md`.
