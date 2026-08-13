# Phase 5 bounded worker execution handoff

**Status:** OPEN until the Phase 5 working tree is reviewed, committed, pushed,
and any separately authorized production rollout is verified.

## 1. What this application is

`popcrm-web` is POP Creations' internal CRM frontend and its companion Node
worker. Staff use the CRM at `https://crm.designflow.app`; the worker imports
Outlook mail, routes CRM records, creates summaries, processes Fireflies meeting
webhooks, and serves Opportunity Chat. The app repo is `/worksp/popcrm-web` on
main. It uses the shared hosted Supabase backend. Scheduled worker commands run
from checked-in `systemd/popcrm-*` units; the always-on Fireflies worker runs in
the `popcrm-fireflies` container at `https://crm-fireflies.designflow.app`.

## 2. What we set out to do this session, and why

This session implemented only Session 5 of
`plan_codebase_audit_remediation.md`: stop Microsoft Graph, OpenRouter,
Fireflies, and scheduled worker commands from hanging forever. The prior audit
found that upstream fetches and one-shot services had no firm end time.

## 3. Current state

The Phase 5 implementation is complete locally and Kimi K3 returned APPROVE
after one correction. Nothing from this phase has been committed, pushed,
installed, restarted, or deployed.

Changed files:

- `workers/lib/worker-foundation.mjs`: validated upstream settings,
  `fetchWithPolicy`, true AbortController deadlines, selected transient retry,
  capped exponential backoff with jitter, safe exhausted-retry errors, and
  response-body cleanup.
- `workers/crm-worker-supabase.mjs`: all Microsoft Graph token/message,
  OpenRouter routing/summary/chat, and Fireflies transcript calls use the new
  policy. OpenRouter calls time out but are not retried because resending a paid
  request could duplicate cost or work.
- `workers/upstream-timeouts.test.mjs`: 13 focused tests for timeout abort,
  retry, retry cap, 401 no-retry, network-reset recovery, application-error
  no-retry, response cleanup, and configuration validation.
- `systemd/popcrm-*.service`: `TimeoutStartSec` is 10 minutes for Outlook, 30
  for reroute, 20 for contact sync, 30 for summaries, and 20 for ignore rules.
- `workers/README.md`, `docs/configuration.md`, `docs/deployment.md`: runtime
  settings, safe retry rules, measured durations, and rollout instructions.

Final local evidence: 7 test files and 95 tests passed; lint had zero errors and
only the existing `src/App.tsx:48` warning; build passed; both worker files
passed `node --check`; `systemd-analyze verify systemd/popcrm-*.service
systemd/popcrm-*.timer` passed; `git diff --check` passed.

Read-only installed-service observations from 2026-08-10 were: Outlook under
one second, reroute 3 minutes 12 seconds, contact sync 8 seconds, summaries 1
second, and ignore rules 1 second. The checked-in ceilings leave ample headroom.

## 4. Everything we tried that did NOT work

- The first Kimi review found that a final transient HTTP response body was not
  cancelled before the retry-cap error was thrown. That could leave an undici
  connection occupied until garbage collection in the long-running Fireflies
  worker. The helper now cancels every transient response body, including the
  final attempt, and the test asserts three cancellations for three failures.
- The first transcript export failed because `.ai/reviews` was not ignored.
  A local-only `.git/info/exclude` entry was added, the temporary prompt was
  removed, and the wrapper then exported the review archives successfully.
  No repository ignore file was changed.

## 5. Root causes and key findings

- Raw `boundaries.fetch` calls had no AbortController deadline, so a remote
  service or socket could hold a worker forever.
- Blind retries would be unsafe. `workers/crm-worker-supabase.mjs` now enables
  retries only for Graph token/message reads and Fireflies transcript queries.
  OpenRouter requests get a deadline and exactly one attempt.
- The checked-in systemd one-shot services had no `TimeoutStartSec`, so their
  command process could remain in the starting state indefinitely.
- The always-on Fireflies worker makes final-response cleanup important because
  it does not exit after a failed request.

## 6. Exact next steps

1. Inspect `git status --short` and the Phase 5 diff without discarding any
   concurrent work. Success means only the files listed in section 3 plus this
   handoff are selected for the Phase 5 commit.
2. Re-run the final gate from section 3 if any file changed after this handoff.
   Success means 95 or more tests pass, lint has no errors, build/syntax/unit
   verification passes, and `git diff --check` is clean.
3. Before committing, run `git var GIT_COMMITTER_IDENT` and require `Albert
   Hazan <u2giants@users.noreply.github.com>`. Commit and push on main only.
   Success means origin/main contains the Phase 5 commit and GitHub checks pass.
4. Do not install the changed service files or restart any worker without
   Albert's exact authorization. After authorization, copy the five units to
   their installed location, run `systemctl daemon-reload`, and restart/check
   only the named Phase 5 services. Success means the installed properties show
   the new time ceilings and every service/container health check passes.
5. Delete this handoff file only after code, GitHub checks, and any authorized
   rollout are proven complete. Git history will retain it.

## 7. Constraints and gotchas

- Main-only app repository. Do not create a feature branch.
- GitHub is the code source of truth. Do not live-edit worker source on the
  server.
- Production changes require exact current-chat authorization.
- Do not retry OpenRouter automatically. It is a paid, potentially duplicate
  operation.
- Upstream failures must never log response bodies, tokens, questions, emails,
  or CRM records.
- This phase makes no shared database change and must not touch `/worksp/shared-db`.

## 8. Access and environment

- Repo: `/worksp/popcrm-web`, branch `main`.
- Kimi review name: `popcrm-phase5-timeouts`; exact model pin confirmed as
  `kimi-code/k3`; final second-turn verdict APPROVE. Archives are local and
  ignored under `.ai/reviews/`.
- No secrets were read or changed. Worker secrets remain in the `vibe_coding`
  1Password vault and mode-600 `/home/ai/.crm-worker.env`.
- No production files, units, containers, timers, or processes were modified.

## 9. Open questions and risks

- Publishing the code alone changes the bind-mounted Fireflies worker file, but
  the running process will not use it until a separately authorized restart.
- Checked-in systemd changes do not affect installed units until an authorized
  installation plus `systemctl daemon-reload`.
- The known `src/App.tsx:48` lint warning predates Phase 5 and belongs to a later
  remediation session.

## Self-audit

Passed on 2026-08-11 UTC: a fresh developer can identify the application and
scope, see exact completed and uncompleted state, avoid the failed response-body
cleanup path, run concrete verification, respect access limits, and continue
without questions.
