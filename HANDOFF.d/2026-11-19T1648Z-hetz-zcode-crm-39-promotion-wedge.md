---
issue: 39
status: BLOCKED
owner: zcode/sess_515fa3ed
---

# Handoff — #39 clear-fields delivery wedged at the shared-db promotion lane

## 0. ⚠️ Business decisions only the owner can make

**Blocking:**
1. **Shared-db lane policy for CLI-rehearsed orphan rows** (blocks #39's closure; plain tag: "database delivery stuck in red tape"). The CRM audit chain was rehearsed on the preview database by hand (CLI), so it left ledger entries with no dispatch-run evidence, and every existing repair flow requires that evidence. Three unlock options with trade-offs are laid out at https://github.com/popcre/shared-db/issues/6820#issuecomment-7015729095 — recommendation: option (a), relax the orphan-reconciliation ordering for CLI-rehearsed rows (smallest, uses flows that already exist); option (c) (owner-decreed one-off preview-ledger cleanup) is fastest but sets precedent. **Put this question to the owner in one message before starting work.** Until then #39 cannot close and clearing a contact's email/phone/title fails honestly on production.
2. If the owner instead says "leave the lane alone": recommend declaring #39's shared-db step parked (keep the issue open with the honest-failure behavior documented) rather than shipping any divergent interim server convention.

**Already settled — do NOT re-ask:**
- The 18 other audit issues (#32–#37, #44, #63, #38, #43, #45, #47, #48, #50–#54) were closed with live proof by zcode/sess_187ecf50 on 2026-11-19 — do not redo.
- #39 ships client-first with an honest "Could not clear …" failure until the shared-db step lands (its plan's own fallback; settled 2026-11-18).
- The test-login cannot archive contacts (`crm_archive_contact` → 403); the clearly named fixture contact "ZZZ audit proof 39" in Triage stays and is documented on the issue.

## 1. What this application is

POP CRM (`popcrm-web`) — internal operations console for POP Creations staff (customers, contacts, licensing pipeline, Outlook email routing, meeting notes, tasks). Vite/React/TypeScript SPA served by nginx; one Coolify container; all data through the shared Supabase project `https://qsllyeztdwjgirsysgai.supabase.co` (production; the CRM preview app uses the same database). Production https://crm.designflow.app, preview https://crm-dev.designflow.app — both track `main` (every push deploys). Repo: https://github.com/u2giants/popcrm-web (single-branch `main`; docs-only pushes skip the build). The database repo is https://github.com/u2giants/shared-db (branch + PR; the AI merges; migrations promote to production through an automatic lane).

## 2. What we set out to do this session, and why

Finish the CRM audit live-proof workstream: (1) browser live proof for 19 fixed audit issues, (2) the shared-db step of #39 (`p_clear_email`/`p_clear_phone`/`p_clear_job_title` on `api.crm_update_contact`), then client follow-ups, close #39, delete both handoff files, refresh AGENTS.md. Trigger: Albert's session instruction 2026-11-19; the 19 issues came from the 2026-11-18 codebase audit.

## 3. Current state — what is true right now (2026-11-19T1648Z / 12:48 PM EST)

- **18 of 19 issues CLOSED with genuine live proof** by zcode/sess_187ecf50 (verified by spot-checking #32/#54 closing comments; proofs used a real browser, same technique as this session). Production and preview served build #239f84a, later #848f2a8 (contains all 19 fixes). The high-severity handoff file was deleted by that session.
- **#39 remains OPEN.** Client side landed (ff135e85: sends the three clear flags; fails honestly until the server gains them). Server side merged but **unpromotable**:
  - The whole CRM chain — 20261223010101-05 (PR #6818), 20261225010001/10003/10004 (PR #6836), 20261225010104 (PR #6840, merged, preview-proven by run 44563812884) — is stuck: production apply refused by the base guard (run 44564769286: "re-derived migration promoted to a database that lacks its base"; the guard keys the declared `derived-from` header against production's ledger; production ledger max is `20261224120000`).
  - Root cause: the batch was rehearsed on preview **outside the governed lane** (CLI `db push`), so preview's ledger holds the versions but **no dispatched preview run exists** for any of them (exhaustive search of the workflow's dispatch history; every `preview` job of #6818/#6836 SKIPPED; the batch's own dispatches 44532807597/44533994147/44535389768 are refused by the never-reapply guard).
  - Full map with unlock options: https://github.com/popcre/shared-db/issues/6820#issuecomment-7015729095 (earlier comments 7010998738 and 7015612161 carry the diagnosis trail). PR #6852 (revert-and-reissue attempt) was closed — CI refuses deleting ledger-applied migrations.
- **Client patch staged, not pushed:** worktree `/worksp/wt/crm-39-client` (branch `crm-39-client`, based on main @ 848f2a8d) — `src/features/crm/api.ts` `updateBuyer` fallback-retry removed; `src/features/crm/api.contacts.test.ts` fallback tests replaced with a no-retry pin; node_modules symlinked. Lint 0, `tsc -b` clean, affected suites 9/9 (api.contacts 5, ContactDrawer.edits 4). Land it only after promotion (see §6).
- **Live proof rehearsed end to end on preview** (this session, real browser): fixture contact "ZZZ audit proof 39" exists in Contacts → Triage (phone 555-0139, title "Proof Operator", drawer shows Edit/Merge/Delete). Proof = Edit → clear Phone/Title → Save → reopen → values stay cleared. Sign-in, navigation, drawer and search flows all scripted and working.
- **Production signature probe** (decisive, no data touched): POST `https://qsllyeztdwjgirsysgai.supabase.co/rest/v1/rpc/crm_update_contact` with `{"p_contact_id":"00000000-0000-0000-0000-000000000000","p_clear_email":true}`, headers `apikey` + `Authorization: Bearer <user JWT>` + `Content-Type: application/json` + **`Content-Profile: api`** (Accept-Profile does NOT work for RPC). Currently 404 PGRST202 (flags absent). After promotion it returns 404 P0002 "contact … not found". Control probe without the flag arg already returns P0002. JWT + anon key captured at `/tmp/crmlive/.jwt` and `/tmp/crmlive/.anonkey` (may vanish; recapture per §8).
- Working tree clean on `main` @ f3ddec36f's descendant — actually popcrm-web local `main` is at 848f2a8d (run `git pull --rebase` before anything). shared-db local `main` synced to f3ddec36f.

## 4. Everything we tried that did NOT work

- **Browser-use plugin driver**: absent in ZCode sessions here (no node_repl tool) — confirmed again this session. **Working substitute:** Playwright 1.65.1 from the npx cache (`createRequire('/home/ai/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/package.json')`), `chromium.launch({headless:true})`; `chromium_headless_shell` installed via `npx -y playwright@1.65.1 install chromium-headless-shell`. Storage states saved at `/tmp/crmlive/state-preview.json` (preview) and `/tmp/crmlive/state.json` (production).
- **Plain preview apply of the batch** — refused three times by the never-reapply guard ("BLOCKED: already applied on preview"; runs 44532807597/44533994147/44535389768).
- **Historical-recovery lane** — impossible: the gate digest-proofs a dispatched run per version; none exist.
- **Ledger orphan reconciliation** — impossible: replacement kind needs the replacement's run artifact (exists for 20261225010104 only), and every kind requires the orphan file absent from main first.
- **Revert-and-reissue (PR #6852, closed)** — CI's applied-migration guard refuses ANY edit or deletion of a version present in a ledger; no reconciliation-aware exception exists in `scripts/check-applied-migration-edit.mjs`.
- **Fix-forward re-issue without the retired-name marker (PR #6840 first push)** — failed CI F5 (`test_f5_no_existing_migration_becomes_a_new_rejection`); fixed by the sanctioned marker `-- restores-retired-object: api.crm_update_contact dropped-by: 20261225010003`, which validates on CI/preview but **cannot** validate on production (production history has no such drop) — that is the production-apply wall.
- **Reverting only the unrelated sandbox migration in the same glob** — accidentally globbed `20261225010000_sandbox_catchup_batch26*`; restored from origin/main. (Careful with globs.)
- **Creating then deleting a throwaway contact** — creation works; archive is 403 for this login, so cleanup-by-UI is impossible. Reuse the existing fixture contact for the proof instead of creating new ones.
- **`Accept-Profile: api` for RPC probes from the page** — CORS strips it; probe from the host with curl + `Content-Profile: api` instead.

## 5. Root causes and key findings

- The three walls, with sources: (1) never-reapply preview guard (message "BLOCKED: already applied on preview…"); (2) evidence requirements: `scripts/historical_preview_recovery.py` header (digest-proof per version) and the reconciliation manifest `config/preview-ledger-orphan-reconciliations.json` (reviewed tuples, modes `replacement_pending`/`rehearsal_reset`/`preview_null_statements_orphan`/`byte_identical_rename`); (3) production base guard (`migration_derivation.py` parses `-- derived-from:` headers; the apply preflight refuses when a declared base is absent from the target ledger) + offline F5 test `test_production_migration_guard.py::test_f5_no_existing_migration_becomes_a_new_rejection` + applied-edit guard `scripts/check-applied-migration-edit.mjs`.
- The rest of the chain CAN reach production once the base un-wedges: 10103/10105/10104/10004 contents are idempotent (create-or-replace / if-not-exists / drop-if-exists — verified by grep), and only `crm_update_contact` is a retired name (marker already on the merged file).
- `grep`-verified: nothing outside `supabase/migrations/` references the wedged version numbers (tests, scripts, config, docs all clean for a future revert IF a lane change ever permits it).
- Test-login permissions: `crm_create_contact` ✓, `crm_update_contact` ✓, `crm_archive_contact` ✗ 403, `crm_create_opportunity` ✗ 403.
- The app's header build stamp (`#239f84a`-style) is the deployed-commit proof; both environments showed it.
- One replacement version may cover several ledger orphans in the manifest (precedent: `20261101123510` in two cases) — useful if the maintainers extend the reconciliation flow.

## 6. Exact next steps (in order)

1. **Check for independent progress first:** read https://github.com/popcre/shared-db/issues/6820 (newest comments), the issue referenced in §0, and `gh pr list --repo u2giants/shared-db --state open`. If the lane maintainers/another session un-wedged the base, skip to step 4. Gate: a base-batch production apply run titled `DB production apply … PR6818` with conclusion success.
2. **If nothing is moving,** put §0 item 1 to the owner in one message (with the recommendation). If the owner picks an option, implement it on shared-db (branch + PR + claim-first, folded into #6820). Gate: production ledger contains `20261223010101` (check: `psql` read or the production-apply run success).
3. **Wait for the base batch to promote** (preview apply fresh → production apply success), plus the pending `2026122501*` versions. Gate: probe flips to P0002 AND `select version from supabase_migrations.schema_migrations where version like '2026122501%'` returns rows (read-only, host psql, password in vault).
4. **Regenerate types** in the popcrm-web worktree `/worksp/wt/crm-39-client`:
   `SUPABASE_ACCESS_TOKEN=$(op read "op://vibe_coding/3t2xoqk5luyz7ffgdhj24gvtpq/SUPABASE_ACCESS_TOKEN") npx --yes supabase@2.105.0 gen types typescript --project-id qsllyeztdwjgirsysgai --schema api,app,core,crm,dam,ingest,pim,plm > src/lib/database.types.ts`
   Gate: `grep -c "p_clear_email" src/lib/database.types.ts` ≥ 1. (The stderr "Unknown: ChildProcess.exitCode" line is a benign CLI teardown warning.)
5. **Land the client patch** already staged in that worktree (fallback-retry removal + tests; diff summary in §3), run `npm run lint` (0 warnings), `npm test` (full suite), `npx tsc -b`, commit to `main` (single-branch), push. Gate: CI green, header hash changes on https://crm.designflow.app.
6. **Live proof #39 on preview** with the stored state (`/tmp/crmlive/state-preview.json`): Contacts → Triage tab → search "ZZZ audit proof 39" → open drawer → Edit → clear Phone and Title → Save → close → reopen → Phone/Title show "—" (screenshot at before/after; save under `/tmp/crmlive/shots/`). Cross-check via REST: `crm_contact_list` row for the fixture has `phone` NULL. You'll know it worked when the reopened drawer shows cleared values AND the REST row is NULL.
7. **Close out:** tick #39's STATUS step 1 (evidence: promoted versions + probe) and step 3, tick `- [x] Live proof recorded` and `- [x] promotion delivered to production`, post a signed evidence comment, close the issue. Then DELETE this handoff file AND `HANDOFF.d/2026-11-19T0425Z-hetz-zcode-audit-medium-live-proof.md` (its only remaining obligation is #39 — successor rule), in the same docs-only commit; verify AGENTS.md pending-work rows reference nothing stale (add a row only if the lane issue stays open for the other four objects).
8. You'll know the whole workstream is done when: probe P0002-with-flags, deployed header hash shows the client commit, fixture contact's phone/title cleared and verified via REST, #39 closed with signed evidence, both handoff files gone.

## 7. Constraints and gotchas in force

- Single-branch `main` on popcrm-web: every push deploys production; never push with lint/test red. Docs-only pushes (`*.md`) skip the build.
- shared-db is claim-first: all work is folded into claim #6820; post updates there, never open a parallel claim.
- Sign every GitHub post `Posted by ZCode chat (sess_515fa3ed) on hetz` (the `ai-gh-signature` helper mislabels this engine).
- Never run migrations or ledger surgery by hand against production; the automatic lane is the only path (owner ruling).
- `src/components/ui/*` are hand-maintained primitives — do not regenerate.
- Playwright note: the headless browser runs in UTC, so the app's "EST" clock label in screenshots is wrong by 5 hours — quote times from the host (`TZ=America/New_York date`), never from screenshots.
- The Bash shell resets cwd between calls; always `cd <dir> && …` in one call.
- Deleting another session's HANDOFF.d file is allowed only as the successor-completion deletion in step 7.

## 8. Access and environment

- `gh` authenticated as u2giants; commits as `Albert Hazan <u2giants@users.noreply.github.com>`.
- 1Password vault `vibe_coding`: CRM test login `pocfv54kga2oszoe64tpkzoizi` (fields username/password); Supabase CLI PAT `3t2xoqk5luyz7ffgdhj24gvtpq` (field `SUPABASE_ACCESS_TOKEN`); shared DB direct password `246sf23gymd64yudpmhswcnyle` (field `password`; read-only SELECT proven fine for prod ledger inspection).
- Playwright: `createRequire('/home/ai/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/package.json')`; login scripts pattern in `/tmp/crmlive/login.mjs`, `t39-*.mjs` (may vanish — recreate from §3/§6 descriptions); preview storage state `/tmp/crmlive/state-preview.json`; screenshots `/tmp/crmlive/shots/`.
- Production probe snippet (recapture JWT by reading `localStorage["<ref>-auth-token"]` in a signed-in page context, or reuse `/tmp/crmlive/.jwt`):
  `curl -s -X POST 'https://qsllyeztdwjgirsysgai.supabase.co/rest/v1/rpc/crm_update_contact' -H "apikey: $(cat /tmp/crmlive/.anonkey)" -H "Authorization: Bearer $(cat /tmp/crmlive/.jwt)" -H 'Content-Type: application/json' -H 'Content-Profile: api' -d '{"p_contact_id":"00000000-0000-0000-0000-000000000000","p_clear_email":true}'`
  PGRST202 = not promoted; P0002 "contact not found" = promoted (signature accepted).
- Worktrees: `/worksp/wt/crm-39-client` (popcrm-web client patch, node_modules symlinked — keep until step 5); shared-db chain worktrees removed; `/worksp/shared-db` canonical clean on main.
- Reserved-but-unusable migration version: `20261225010104` is MERGED on main (in the wedged chain) — do not reserve or reuse it; the five chain versions `20261225010305-309` were reserved then the PR closed (refs/db-claims) — a future chain re-author should reserve fresh versions again.

## 9. Open questions and risks

- The wedge may be repaired independently by the lane maintainers (a fixer-hardening PR #6839 was in flight 2026-11-19 13:41Z; several robots iterate hourly). Always re-check #6820 and open PRs before doing anything.
- If/when the base batch promotes, expect a short PostgREST schema-cache lag before the probe flips (retry after a few minutes).
- Preview's ledger rows for the nine versions may or may not carry a `statements` array (affects which reconciliation mode fits — check `statements` IS NULL via the Management API if a lane change needs it).
- The fixture contact "ZZZ audit proof 39" cannot be removed by this login (archive 403); it is documented on #39 as proof data — do not create more.
- #63 and #36 proofs were done by the earlier session against worker behavior on the same host; their evidence was accepted — do not reopen.
- If the owner declines any lane change, #39 stays open indefinitely with honest failures; the issue comment of record is https://github.com/u2giants/popcrm-web/issues/39#issuecomment-7011554754 plus the closing addendum to follow.

## Self-audit gate (handoff-writer, 2026-11-19T1648Z)

1. Street-newcomer continuity: **Yes** — §1 app context, §3 exact state with run ids and probe facts, §6 ordered steps with gates, §8 access incl. reusable snippets.
2. Continue as effectively as me: **Yes** — §4 carries every dead end (all three walls plus the small traps), §5 the guard/source mapping, §7 the session traps (cwd reset, UTC screenshots, glob hazard).
3. All relevant detail present: **Yes** — background §1–2, state §3, failures §4, findings §5, steps §6, constraints §7, access §8, risks §9; client diff summary and proof flows are in §3/§6; no sub-agents were used (no part (b) needed).
4. §0 completeness: swept §1–§9 line by line; the only business-meaning asks are the lane-policy decision (§0 item 1, with recommendation) and the parked-if-declined fallback (§0 item 2); everything else is AI-executable or documented as Blocked. **Yes.**
