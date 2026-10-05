# CLAUDE.md — popcrm-web

Read `AGENTS.md` first. It is the canonical operating guide and documentation
router; this file only adds Claude Code-specific notes.

- This is the **POP CRM frontend**, not the PIM frontend. The correct repo/
  package/image/Coolify-app name is `popcrm-web`.
- `.claudeignore` is honored by Claude Code. For any other AI tool, follow
  `AGENTS.md` → AI tool notes / What to ignore.
- **Deployment:** push to `main` → GitHub Actions → GHCR → Coolify (see
  `AGENTS.md` → Deployment). SSH is break-glass only.
- **Branching:** single-branch model — commit directly to `main`.
- **Shared DB / host / secrets / quirks / incidents:** all live behind the
  pointers in `AGENTS.md`. Do not restate them here.

Background on the redesign (charts, tokens, layout) lives in `frontend_imp.md`
(historical plan, largely implemented).
