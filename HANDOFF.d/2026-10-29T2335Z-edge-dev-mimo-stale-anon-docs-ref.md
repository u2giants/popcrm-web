---
issue: none
status: OPEN
owner: mimo/edge-dev — popcrm-web main (2026-10-29 wrap-up session)
---

`issue: none` because the 2026-10-29 wrap-up scope freeze forbids opening new
issues; this workstream is a one-line docs-reference fix. Treat as UNPROVABLE
until someone opens an issue or lands the fix below.

# Stale 1Password reference in popcrm-web development docs

## 0. ⚠️ BUSINESS DECISIONS ONLY THE OWNER CAN MAKE

None — nothing in this workstream needs the owner. The only work item is a
one-line documentation correction (technical).

Already settled — do NOT re-ask:
- 2026-10-29: the eight global contact Titles (SVP, GVP, VP, GMM, DMM, BUYER,
  ASSOCIATE BUYER, ASSISTANT BUYER) were requested, shipped, and confirmed live
  by the owner's "ship" go-ahead. That feature is finished and verified.

## 1. What this application is

`popcrm-web` is the POP CRM frontend — a Vite/React/TypeScript single-page app
used by internal POP Creations staff for customers, contacts, programs,
email routing, meetings, notes, tasks and licensor approvals. It stores no data
of its own; every read/write goes through the shared Supabase project
`https://qsllyeztdwjgirsysgai.supabase.co`. Production: https://crm.designflow.app.
Repo: https://github.com/u2giants/popcrm-web (branch `main`, single-branch
direct-push release model — pushing `main` builds and deploys via GitHub Actions
+ GHCR + Coolify).

## 2. What we set out to do this session, and why

Albert asked (2026-10-29): clone the repo, add SVP / GVP / VP / GMM / DMM /
BUYER / ASSOCIATE BUYER / ASSISTANT BUYER as Titles **across all customers, not
per customer**, then "ship". That feature is DONE and live (see §3). This
handoff exists only because the closing wrap-up sweep found one stale
documentation reference (below) and the wrap-up scope freeze forbids fixing
discoveries during close-out.

## 3. Current state — what is true right now

DONE and verified:
- Global titles live in one shared list used by every customer. Entry point:
  `CONTACT_TITLES` in
  https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/constants.ts
  with helpers `contactTitleValues` / `contactTitleOptions` in
  https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/pages/_shared.ts
  wired into the Contacts Title picker and the Data Admin → Contact Values
  Titles list.
- Commit: https://github.com/u2giants/popcrm-web/commit/ad2fc124926f7d04b5d793047725e833755ef831
  (`crm: global Title list shared by every customer`) — pushed to `main`
  2026-10-29 ~5:49 PM EDT; Build and Deploy workflow green including its
  "Wait for production to serve this commit" step; the Title menu was then
  re-verified in the live app at https://crm.designflow.app (all eight titles
  visible in the dropdown). 195 tests, lint and typecheck were green pre-push.
- Working tree clean; `main` in sync with `origin/main`.

NOT DONE (the reason this file exists):
- https://github.com/u2giants/popcrm-web/blob/main/docs/development.md#L57
  tells future sessions to read the Supabase anon key from
  `op://vibe_coding/sgk6fhcjdluqvnbsekjzdkftpa/SUPABASE_ANON_KEY`. That item id
  no longer resolves in 1Password ("itemNotFound", verified 2026-10-29). The
  key is not missing — it lives under the item titled
  `Supabase Runtime Keys - shared POP database (production)` (field
  `SUPABASE_ANON_KEY`, Concealed). The doc still points at the dead id.

## 4. Everything we tried that did NOT work

- `op://vibe_coding/sgk6fhcjdluqvnbsekjzdkftpa/SUPABASE_ANON_KEY` (the exact
  reference the docs give): 1Password MCP `op_check_ref` returned
  "itemNotFound" and direct item lookup by that id returned "item couldn't be
  found" (2026-10-29). So the reference is dead, not just ugly — do not trust
  it as a fallback.
- `ai-shared-db-closeout-check --session-id <id>` failed closed with
  `{"error":"GitHub request timed out","ok":false}` on three consecutive runs
  (2026-10-29, ~19:25–19:32 EDT) while `gh` was healthy; its payload still
  showed zero blocking claims/stages and `gh search issues` found no
  shared-db issue referencing the session id. Not this workstream's fix —
  recorded so nobody mistakes the flake for a held claim.
- Playwright CLI (`@playwright/cli` 0.1.22) on a Windows host without
  browsers installed: `open` fails and the CLI prints
  `Unknown: ChildProcess.kill (<parent command line>)` — a cosmetic
  daemon-detach artifact of this environment; the browser session actually
  survives and follow-up `snapshot` works. The bundled
  `playwright_cli.sh` wrapper also breaks on its git-bash→npx handoff here;
  call `npx --yes --package @playwright/cli playwright-cli` directly. Browsers
  are fixed by running the cached `playwright/cli.js install chromium` once.
  These are machine-level quirks, already handled for this machine; noted in
  case a different machine repeats them.
- `1password_op_run` under Windows PowerShell 5.1 cannot run `npx` (execution
  policy blocks `npx.ps1`); use `shell: "pwsh"` and pass secrets only via env
  (`op://` refs) with `"$env:VAR"` in the command text.

## 5. Root causes and key findings

- The docs' anon-key reference points at a 1Password **item id** that was
  presumably deleted or replaced at some point (the docs do not say when).
  Title-based `op://` references survive item churn better than opaque ids —
  the fix below uses one.
- The correct target (verified 2026-10-29 via 1Password item lookup, no reveal):
  vault `vibe_coding`, item title `Supabase Runtime Keys - shared POP database
  (production)`, field `SUPABASE_ANON_KEY`. That entry also documents the
  legacy-JWT vs `sb_secret_`/`sb_publishable_` key generations — read its notes
  before touching Supabase keys anywhere.
- The Supabase anon key is public client configuration (it is also committed in
  the repo's own `.env.example`); the vault copy is a convenience reference,
  not leak remediation.

## 6. Exact next steps

1. Open
   https://github.com/u2giants/popcrm-web/blob/main/docs/development.md#L57
   (the `export VITE_SUPABASE_ANON_KEY=...` line in "Live Browser
   Verification") and replace the dead reference
   `op://vibe_coding/sgk6fhcjdluqvnbsekjzdkftpa/SUPABASE_ANON_KEY` with
   `op://vibe_coding/Supabase Runtime Keys - shared POP database (production)/SUPABASE_ANON_KEY`.
   Leave the rest of the section untouched. (If `op` on a machine refuses a
   title with spaces/parens, fall back to the item id
   `3hhxwrljnaq2tykxi7hplq5ryi` — valid as of 2026-10-29 — but prefer the
   title form.)
2. Validate the new reference without printing any value: run
   `1password_op_check_ref` (or `op read '<new ref>' | sha256sum | cut -c1-16`
   as a fingerprint-only check) and require `resolved: true`.
3. Confirm the dead id `sgk6fhcjdluqvnbsekjzdkftpa` no longer appears anywhere
   in the repo (`rg sgk6fhcjdluqvnbsekjzdkftpa` at repo root → zero hits).
4. Run the repo's checks per its AGENTS.md (`npm run lint`, `npm test`,
   `npm run build` — a docs-only change should be unaffected) and
   `ai-task-gates start --class <class>` / `check --before ship` as the gate
   tool instructs for these paths.
5. Commit and push to `main` (this repo's single-branch model; a docs commit
   triggers the usual Build+Deploy, which is routine). Suggested subject:
   `docs: point local-dev anon key at the live 1Password item`.

You'll know it worked when: the new `op://` reference resolves
(`resolved: true`), the old id is gone from the repo, and the docs commit is on
`main` (https://github.com/u2giants/popcrm-web/blob/main/docs/development.md
shows the new reference).

## 7. Constraints and gotchas in force

- popcrm-web ships by pushing `main` directly (its AGENTS.md: "single-branch
  model — commit to `main`; do not create feature branches"). Pushing `main`
  deploys to production — that is the repo's normal release contract.
- `src/**` edits escalate `ai-task-gates` to class `ui-live-workflow`, which
  requires local-tests + authenticated-workflow-proof + visual-proof before
  `check --before ship` allows a push. A docs-only change should classify
  lower; trust the gate tool's classification rather than assuming.
- Secrets never appear in chat, arguments, output, logs or commits. Use
  1Password `op://` references / `op_run` env injection. This file names
  locations only.
- Do not open, edit or delete another session's `HANDOFF.d/` file; the root
  `HANDOFF.md` is a static pointer and must not be rewritten.
- This fix was deferred by the wrap-up scope freeze (2026-10-29): discoveries
  during close-out go to the handoff, not into the closing session.

## 8. Access and environment

- GitHub: `gh` authenticated as `u2giants` on this machine (2026-10-29);
  repo https://github.com/u2giants/popcrm-web.
- 1Password: MCP service account, vault `vibe_coding` (the only reachable
  vault). Test login for browser verification of the live app:
  item `POP CRM live test login - Codex` (Login; username
  `codex.crm.verify@designflow.app`, password Concealed — use `op_run`, never
  reveal). Supabase keys: item `Supabase Runtime Keys - shared POP database
  (production)`.
- Local dev: `npm install && npm run dev` with `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` from the reference above (anon key is also in the
  committed `.env.example`). Browser automation: Playwright CLI via
  `npx --yes --package @playwright/cli playwright-cli` (chromium must be
  installed once — see §4).
- Node/npm present on the machine (Node 24, npm 11, 2026-10-29).

## 9. Open questions and risks

- Unknown when/why the 1Password item `sgk6fhcjdluqvnbsekjzdkftpa` disappeared
  (no date in the docs). If other repos reference the same id, sweep them the
  same way — unverified, nobody has checked (raised 2026-10-29).
- `ai-shared-db-closeout-check` GitHub timeouts (2026-10-29) may be
  environmental or an upstream rate limit; if it keeps failing for sessions
  that DO shared-db work, that becomes a real safety gap. Tracked nowhere yet.
- Nothing here reopens the titles feature; it shipped and is live.

---

## Self-audit (2026-10-29, mimo)

1. Could a brand-new developer pick this up with no context? Yes — §1 names the
   app/stack/URLs, §3 pins the exact broken line and the correct vault item,
   §6 gives five ordered steps with a success gate.
2. Could they continue as effectively as the author? Yes — §4 and §5 carry the
   verified dead-end evidence (itemNotFound on the old id), the working
   fallback, and the environment quirks that cost this session time.
3. Is every relevant detail included? Yes — background/goal (§2), current
   state with GitHub URLs and commit link (§3), failures (§4), findings (§5),
   exact actions + verification (§6), constraints (§7), access/secrets by
   location (§8), risks (§9). Secrets appear as vault titles only.
4. Does §0 hold every owner decision and no technical approval? Yes — the
   sweep of §1–§9 found no business decision; the one deferred item is a
   technical docs fix, which is work (§6), not an owner ask. §0 says so
   explicitly and records the settled 2026-10-29 titles decision so it is not
   re-asked.
