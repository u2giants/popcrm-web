# Development — popcrm-web

## Setup

```bash
npm install
npm run dev
```

## Checks

```bash
npm run build
npm run lint
```

Current known lint warnings may exist in `src/auth/auth.tsx`; do not add new warnings in changed code.

## Local Backend

By default, the app talks to production Directus at `https://data.designflow.app`.

To use another Directus instance, create `.env`:

```bash
VITE_DIRECTUS_URL=http://localhost:8055
```

## Frontend Redesign

Read `frontend_imp.md` before substantial UI work. The chosen direction is Tailwind Plus Application UI for app patterns and Tremor for analytics, while keeping the current Vite/React/Directus SDK architecture.
