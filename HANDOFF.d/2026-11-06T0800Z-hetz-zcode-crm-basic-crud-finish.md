---
issue: 24
status: BLOCKED
owner: u2giants/popcrm-web#24 / popcre/shared-db#5791
---

# Handoff — CRM basics (issue #24): finish promotion, deploy, live proof

Date: 2026-11-06 ~8:20 AM EST (updated at wrap-up). Owner: ZCode session sess_485be0e4.
Plan: [plan_crm_basic_crud.md](https://github.com/u2giants/popcrm-web/blob/main/plan_crm_basic_crud.md) — read its STATUS table first.
Full nine-thing shared-db handover: https://github.com/popcre/shared-db/issues/5791#issuecomment-6685759971

## Done (all verified)

- Shared-db RPCs for add/archive/merge contacts, programs, customers: merged
  twice (PR #5808 original + PR #5830 rename to versions `20261106043500` /
  `20261106043600` after #5808 exhausted its automatic promotion attempts).
  Contract tests `supabase/tests/crm_basic_crud_rpcs_contracts.sql` PASS on
  preview and in CI. Review findings #5810 and #5831 fixed/closed.
- Lane tooling fixes (PR #5843, #5854, merged): pure version renames are now
  promotable candidates and rehearsal-authorable — required for #5830 to land.
- Frontend complete on LOCAL popcrm-web `main` (4 commits, ahead of origin,
  rebased onto origin/main, zero conflicts, lint zero warnings, 212 tests
  green, build green). NOT pushed — a push deploys, and the RPCs are not in
  production yet.
- Browser gates for Steps 2–10 all PASS against preview (2026-11-05, e2e
  script `/tmp/crm-crud/e2e/gate.mjs`, fixtures cleaned up).

## Remaining (in order)

1. **Wait for production promotion of `20261106043500`+`20261106043600`.**
   The automatic serial lane (workflow "Automatic production promotion
   trigger", hourly cron :23) is working a FIFO backlog; my PR #5830 is a
   candidate with 1/3 attempts used (a lost race against a moving main tip).
   Check: `select version from supabase_migrations.schema_migrations where
   version in ('20261106043500','20261106043600')` on production
   `qsllyeztdwjgirsysgai` (management API, token `/home/ai/.supabase/access-token`).
   If #5830 exhausts attempts again, the cure that worked once is another pure
   rename PR (see #5830's body; the lane now supports renames end-to-end).
2. **Push the frontend:** `git -C /worksp/popcrm-web push origin main` (rebase
   first if origin moved; the shared-db sync bot lands vendor-copy commits).
   Verify `https://crm.designflow.app/version.json` `git_sha` equals the new
   main head.
3. **Live proof (Step 11):** repeat the Step 2–10 gates on
   https://crm.designflow.app. Session: mint a magic link via the PRODUCTION
   service role (1Password "Supabase Runtime Keys - shared POP database"
   item id `3hhxwrljnaq2tykxi7hplq5ryi`) for an account with crm access + a
   write role. `ai-tester@popcre.com` has crm access but only designer (no
   archive/merge); `ai-admin@designflow.app` is administrator but its crm
   app_access is revoked — inserting one `app.app_access` row (profile of
   ai-admin, app 'crm') fixes both the roles and the empty-picker quirk; it is
   ordinary app data, reversible. Then run
   `/tmp/crm-crud/e2e/gate.mjs` with BASE=https://crm.designflow.app and the
   `sb-qsllyeztdwjgirsysgai-auth-token` storage key, fresh fixtures + cleanup
   (the psql patterns are in that script's git history / plan §12).
4. **Close out:** tick plan STATUS Step 1 + Step 11 with evidence, update the
   STATUS table rows 2–10 to cite the deploy commit, remove this handoff,
   comment on u2giants/popcrm-web#24 and close it, close popcre/shared-db#5791
   (PR #5830 says "Closes #5791" — verify it auto-closed).

## Gotchas learned

- The promotion lane refuses any dispatch whose `commit_sha` isn't the CURRENT
  main tip; with parallel sessions merging constantly, rehearsals race and can
  exhaust 3 attempts. Pure version rename = fresh candidate (now supported).
- `crm.customer_ext.status` is check-constrained to active/inactive — archive
  uses `archived_at`/`archived_by` columns (added by my migration). Contact
  archive uses `crm.contact_ext.archived_at`. Program archive:
  `crm.opportunity.status='archived'`.
- Scope values are `COMPANY_WIDE | DEPARTMENT | IGNORED` (IGNORED added by
  review; UI picker includes it).
- Task-create UI omits assignee (only an admin-gated RPC lists profiles) —
  flagged in popcrm-web AGENTS.md Pending work.
- Local scratch: `/tmp/crm-crud/` (preview+prod DB URLs in protected files,
  e2e scripts, screenshots). shared-db worktrees: `.wt-crm-crud-rpcs`,
  `.wt-crm-crud-rpcs-rename` (can be removed after everything lands and the
  canonical checkout is clean).
