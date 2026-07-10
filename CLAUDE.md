# CLAUDE.md — popcrm-web

Read `AGENTS.md` first. It is the canonical operating guide and documentation
router; this file only adds Claude Code-specific notes.

- This is the **POP CRM frontend**, not the PIM frontend. The correct repo/
  package/image/Coolify-app name is `popcrm-web`.
- `.claudeignore` is honored by Claude Code. For any other AI tool, follow the
  "What to ignore" section in `AGENTS.md`.
- **Deployment:** push to `main` → GitHub Actions → GHCR → Coolify (see
  `AGENTS.md` → Deployment). **SSH is not the normal deploy path** — manual
  `docker run` on the host is break-glass only.
- **Shared server standards:** infrastructure/server context also lives in
  [`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure).
  Keep it in sync when this app's deployment, domains, runtime ownership, server
  dependencies, or incident runbooks change.
- **Branching:** single-branch model — commit directly to `main`; do not create
  feature branches for this repo.
- **Shared DB Gatekeeper:** this repo shares Supabase project
  `qsllyeztdwjgirsysgai` with the other POP apps. All database/schema changes
  must be authored in canonical
  [`u2giants/shared-db`](https://github.com/u2giants/shared-db) before app code:
  branch + PR + timestamped migration, preview-first, and the AI merges it. Do
  not make app-side DDL, inline/startup migrations, dashboard SQL, one-off
  `execute_sql`, or local `supabase/migrations/` changes here. The only local
  migration copy is the auto-synced read-only `shared-db/` folder. The guard
  workflow `.github/workflows/shared-db-guard.yml` runs on push and pull request
  and only allows owner-approved overrides via PR label `db-change-approved` or
  `[db-change-approved]` in a commit message.
- Background on the redesign (charts, tokens, layout) lives in `frontend_imp.md`
  (historical plan, largely implemented).
