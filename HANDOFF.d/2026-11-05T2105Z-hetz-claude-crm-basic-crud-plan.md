# Handoff — CRM basic add/delete/merge (plan written, build not started)

Updated 2026-11-06 10:06 AM EST. Owner: Albert (POP Creations). Repo `u2giants/popcrm-web`, branch `main` (single-branch model).

1. **Goal:** salespeople can add, remove and merge contacts, set contact scope,
   add/remove programs, remove notes/tasks/meetings, add tasks from the Tasks
   page, and remove customers — with removals recoverable.
2. **Spec:** https://github.com/u2giants/popcrm-web/blob/main/plan_crm_basic_crud.md
   (read its STATUS table first; it holds background, rejected approaches,
   locked decisions, steps with verification gates, tests, access).
   Tracking issue: https://github.com/u2giants/popcrm-web/issues/24
3. **Done in this session (verified live):** contact editing (commit `56300434`);
   deploy repair via app-scoped Coolify write token (`9e801d67`, by a sub-session);
   filter dropdown fix and defunct contacts (quit/transferred/retired, admin and
   sales only — Albert's choice), shipped by sub-sessions. Live
   `https://crm.designflow.app/version.json` showed `2a57866` on 2026-11-06.
4. **Not done:** every plan step (0–11). Nothing in progress, no open branch or PR.
5. **Tried and rejected:** hard deletes (cascades, shared master data), app-repo
   migrations, direct inserts into `core.contact`, widening grants — see plan §7.
6. **Gotcha:** "delete contact" (Step 3) must build on the shipped defunct-contact
   feature (`crm.contact_ext`), not duplicate it.
7. **Next action:** plan Step 0 (read-only check of live table permissions).
8. **Verify:** each step's gate in the plan; final proof on crm.designflow.app.
9. **Shared-db:** this session holds no claims (closeout check ok 2026-11-06).
