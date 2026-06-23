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
- **Shared database / cross-app:** before any shared Supabase database, schema,
  migration, or cross-app change, read and follow `shared-db/AGENTS.md` (the
  cross-app coordination playbook) — app code here is `main`-only; `shared-db`
  changes use branch+PR and the AI owns the merge.
- Background on the redesign (charts, tokens, layout) lives in `frontend_imp.md`
  (historical plan, largely implemented).
