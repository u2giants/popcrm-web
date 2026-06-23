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

By default, the app talks to the shared Supabase project at
`https://qsllyeztdwjgirsysgai.supabase.co`.

Create `.env` with the frontend Supabase config:

```bash
VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
# Optional: publishable logo.dev key for account logos.
VITE_LOGODEV_TOKEN=pk_xxxxxxxxxxxxxxxx
```

The Supabase anon key is public client configuration, not a service-role key.

## Frontend Redesign

Read `frontend_imp.md` before substantial UI work. The implemented direction is Tailwind Plus Application UI for app patterns and shadcn charts (Recharts) for analytics, themed by the shared design tokens in `src/index.css`, while keeping the Vite/React/Supabase architecture.

For infrastructure/server decisions, also keep
[`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure)
in sync with this repo's docs.
