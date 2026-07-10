# Handoff — Shared DB Gatekeeper and Legacy Account Cleanup

Date: 2026-07-10

## What this application is

`popcrm-web` is the POP CRM frontend: a Vite/React/TypeScript single-page app
served by nginx at `https://crm.designflow.app`. Internal POP Creations staff use
it for customer, contact, sales pipeline, Outlook email routing, Fireflies
meeting notes, tasks, notes, approvals, and CRM settings work.

The app stores no data of its own. All data reads/writes go through the shared
Supabase backend project `qsllyeztdwjgirsysgai`, also used by other POP apps.
The canonical backend/schema repo is `/worksp/shared-db`
(`https://github.com/u2giants/shared-db`). This app repo is main-only and deploys
from `main` through GitHub Actions, GHCR, and Coolify.

## What we set out to do this session, and why

The session goal was to prevent future AI sessions from making shared Supabase
schema changes inside this app repo. The owner explicitly required:

1. Add the standard shared database guard workflow from `u2giants/ai-devops`.
2. Add a "Shared DB Gatekeeper" rule to `AGENTS.md` and `CLAUDE.md`.
3. Commit directly to `main`, push, and confirm the new workflow appears in
   GitHub Actions.

This matters because the shared Supabase backend serves CRM, DAM, PM/PIM, and
other POP apps. App-side DDL, local migrations, dashboard SQL, or one-off SQL can
create drift and break a different app.

## Current state

- Local repo: `/worksp/popcrm-web`
- Branch: `main`
- Remote: `origin` / `https://github.com/u2giants/popcrm-web.git`
- Latest local/remote commit before this closeout-docs update: `4d827e7`
- Session commit: `ea04ae9` (`Add shared DB guard [db-change-approved]`)
- Expected worktree at closeout after committing this handoff update: clean

Implemented this session:

- Added `.github/workflows/shared-db-guard.yml`.
- Removed the older `.github/workflows/forbid-shared-db-bypass.yml` so there is
  one standard guard and one standard override path.
- Added `AGENTS.md` section `Shared DB Gatekeeper`.
- Updated `CLAUDE.md` with the same rule.
- Corrected `AGENTS.md` rows that previously pointed migrations at this repo's
  vendored `shared-db/` folder; they now point backend changes to canonical
  `/worksp/shared-db/supabase/migrations/`.

Verification already completed:

- `gh workflow list --repo u2giants/popcrm-web` shows `shared-db guard` as
  active.
- `shared-db guard` passed on commit `ea04ae9`.
- Later auto-sync pushes also triggered and passed `shared-db guard`.
- `Build and Deploy` passed on `ea04ae9`: lint, typecheck/build, image push, and
  Coolify deploy.
- GitHub Actions deploy log verified production served commit `ea04ae9`.

Important note:

- The guard workflow file itself contains DDL regex strings, so the installation
  commit intentionally used the documented push override
  `[db-change-approved]`. That was only to land the guard cleanly; normal future
  database changes should not use the override without owner approval.

## Everything we tried that did NOT work

- Tried to apply a larger `AGENTS.md` patch in one pass. It failed because the
  exact context line for the documentation table did not match. Fix: inspected
  numbered lines with `nl -ba AGENTS.md` and applied smaller patches.
- Tried to verify production with a `<meta name="build-sha">` grep. The current
  app does not expose the commit SHA in an HTML meta tag; the commit stamp is
  baked into the JS bundle and displayed in the app header. Fix: relied on the
  existing GitHub Actions deploy step, which fetches the production JS bundle and
  greps for the expected short SHA. The run logged `production is serving commit
  ea04ae9`.
- The root `HANDOFF.md` from 2026-06-28 was stale. It said the customer-named CRM
  contract app commit had not been pushed, but commit `29642f9` is now in
  history and deployed. Fix: replaced the handoff with this accurate closeout.

## Root causes and key findings

- The repo already had a custom guard workflow,
  `.github/workflows/forbid-shared-db-bypass.yml`, but it did not match the
  standard template or documented override path. It was replaced by
  `.github/workflows/shared-db-guard.yml`.
- `AGENTS.md` already warned that `shared-db/` is read-only, but two task routing
  rows still named `shared-db/supabase/migrations/` without saying it is the
  vendored copy. Those are now explicit about canonical `/worksp/shared-db`.
- There is no `.cursor/rules/` folder in this repo, so no Cursor rule file was
  added.
- `/worksp/shared-db` was inspected only for status; no canonical shared-db files
  were edited by this session.
- `/worksp/shared-db` is currently on branch
  `codex/popdam-rich-pdf-extraction-docs`, clean at closeout. That is a separate
  shared-db task branch, not work from this CRM guard session.

## Exact next steps

1. For future CRM app work, continue using this repo's `main` branch.
   Verification gate: `git status --short --branch` shows
   `## main...origin/main` with no dirty files.
2. For any shared Supabase schema/API/RLS/view/RPC change, start in
   `/worksp/shared-db`, not here.
   Verification gate: the change is represented by a timestamped migration on a
   shared-db branch/PR and preview is tested before production.
3. For the legacy account compatibility cleanup, scan all POP app repos for live
   callers of `crm_account_*` and `crm_update_account`, then create a new
   shared-db migration that drops/revokes only after owner approval.
   Verification gate: all app scans are clean, the shared-db PR passes, preview
   works, and production rollout is explicitly approved.
4. After the compatibility cleanup lands, regenerate affected app database types
   and delete this `HANDOFF.md` only when there is no unfinished work.
   Verification gate: no `HANDOFF.md` remains, app builds pass, and production
   deploy verifies the intended SHA.

## Constraints and gotchas in force

- App repos are main-only; do not create feature branches in `popcrm-web`.
- Shared backend changes belong in `u2giants/shared-db` with branch + PR; the AI
  opens and merges the PR when safe.
- Do not hand-edit this repo's vendored `shared-db/` mirror.
- Do not add app-side DDL, inline/startup migrations, dashboard SQL, one-off
  `execute_sql`, or local `supabase/migrations/` migrations here.
- The guard override exists only for owner-approved exceptions:
  PR label `db-change-approved` or `[db-change-approved]` in a commit message.
- Production deploy verification for this app is currently via the GitHub
  Actions bundle-SHA check, not a `build-sha` meta tag in `index.html`.

## Access and environment

- GitHub CLI is authenticated and was used for workflow/run verification.
- Production app URL: `https://crm.designflow.app`
- Preview alias: `https://crm-dev.designflow.app`
- Shared Supabase project: `qsllyeztdwjgirsysgai`
- Canonical shared-db repo: `/worksp/shared-db`
- Secrets remain in 1Password vault `vibe_coding`; no secret values were added
  or printed this session.

## Open questions and risks

- Legacy `api.crm_account_list`, `api.crm_account_overview`, and
  `api.crm_update_account` compatibility objects still exist intentionally. The
  cleanup is a future shared-db change and should not be done casually.
- GitHub Actions emits a Node.js 20 deprecation warning for `actions/checkout@v4`
  and `actions/setup-node@v4` being forced to Node.js 24 by the runner. It did
  not block this session, but a future CI maintenance pass may need to update
  action versions if warnings become failures.
- Self-audit passed: this handoff names the app, session goal, current state,
  failed attempts, root findings, exact next steps with verification gates,
  constraints, access/environment, and remaining risks for a fresh developer.
