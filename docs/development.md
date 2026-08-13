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

Lint should pass cleanly; do not add new warnings in changed code.

## Local Backend

By default, the app talks to the shared Supabase project at
`https://qsllyeztdwjgirsysgai.supabase.co`.

Create `.env` with the frontend Supabase config:

```bash
VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
# Optional: publishable logo.dev key for customer logos.
VITE_LOGODEV_TOKEN=pk_xxxxxxxxxxxxxxxx
```

The Supabase anon key is public client configuration, not a service-role key.

## Live Browser Verification

A dedicated live test login exists for Codex/AI browser checks on
`https://crm.designflow.app`. The 1Password item is
`POP CRM live test login - Codex` in the `vibe_coding` vault. Use it when a UI
issue must be verified against the deployed app and real Supabase data; do not
copy the password into docs, commits, or logs.

For local reproduction against the real backend, run Vite with the public
Supabase URL and anon key from 1Password, then log in with the test account:

```bash
export VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co
export VITE_SUPABASE_ANON_KEY="$(op read 'op://vibe_coding/sgk6fhcjdluqvnbsekjzdkftpa/SUPABASE_ANON_KEY')"
npm run dev -- --host 0.0.0.0
```

When debugging visual overflow, verify with browser measurements in addition to
screenshots. For example, compare the affected scroll container's `clientWidth`
and `scrollWidth`; on 2026-06-30 the live Data Admin table at `#61615cd`
measured `704 / 1234` (overflow), while the local fixed source measured
`1304 / 1304` with the same data.

## Dependencies and advisories

Checked 2026-08-13. `npm audit` and `npm audit --omit=dev` both report **0
vulnerabilities**, so there is no documented residual advisory to review. Re-run
both at the start of any dependency session; advisories are time-sensitive.

What that pass changed, and why it matters if you touch these again:

- **`shadcn` is a devDependency, not a runtime one, but it is NOT unused.**
  `src/index.css` line 3 does `@import "shadcn/tailwind.css"`, so removing the
  package breaks `npm run build` even though nothing imports it from TypeScript.
  Grepping only for JS/TS imports will tell you it is dead code. It is not.
  The Docker image runs a plain `npm ci` (dev dependencies included), so
  devDependencies is the correct home for it.
- **Recharts is on v3.** `src/components/ui/chart.tsx` was the shadcn chart
  primitive; nothing in the app imported it, and its types no longer compile
  against Recharts v3, so it was deleted rather than migrated. The charts the
  app actually renders are `ChartAreaVolume`, `ChartDonut` and `ChartHBar` under
  `src/components/app/`.
- **React Router is on 7.18.2** and **Vitest on 4.x**, both of which closed
  advisories rated high and critical respectively.

## Frontend Redesign

Read `frontend_imp.md` before substantial UI work. The implemented direction is Tailwind Plus Application UI for app patterns and shadcn charts (Recharts) for analytics, themed by the shared design tokens in `src/index.css`, while keeping the Vite/React/Supabase architecture.

For infrastructure/server decisions, also keep
[`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure)
in sync with this repo's docs.
