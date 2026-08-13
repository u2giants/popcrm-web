# Copy-paste prompt to start Phase 7A (shared-db)

Start a fresh AI session with working directory `/worksp/shared-db` and paste
everything below the line.

---

You are the shared-db orchestrator session for POP CRM audit remediation Phase 7A.

Read `/worksp/shared-db/AGENTS.md` in full first, then load the
`shared-db-orchestrator` skill. Follow that workflow exactly: you orchestrate and
dispatch, you do not author the migration yourself. Dispatch the work to an
isolated implementation sub-agent in its own git worktree, and route every review
finding back to that same agent until it passes.

Background you need:

- Consumer repo: `/worksp/popcrm-web` (GitHub `u2giants/popcrm-web`, branch `main`).
- The full plan is `/worksp/popcrm-web/plan_codebase_audit_remediation.md`.
  Read "Session 7A — Create preview-proven server aggregate contracts" (~line 771)
  and "Session 7B" for the downstream consumer.
- Prior phase handoff: `/worksp/popcrm-web/HANDOFF.d/2026-08-12T1548Z-hetz-codex-phase-six-complete.md`.
- Shared Supabase production project: `qsllyeztdwjgirsysgai`.
  Preview branch: `rjyboqwcdzcocqgmsyel` (NOT the old `xjcyeuvzkhtzsheknaiu`).

The problem being fixed: the POP CRM Overview page and sidebar download entire
tables into the browser and count rows client-side. This does not scale and leaks
more data than the screen needs.

Task:

1. Inventory every exact number, chart series, and activity row the CRM Sidebar
   and Overview display: customer and contact totals, open opportunities, email
   routing-status counts, the 12-week email series, meeting count and recent
   meetings, open tasks, pending approvals, pipeline-stage counts, and recent
   unrouted emails. Produce a durable mapping naming each displayed value, its
   source table, its filter, its failure boundary, and its maximum recent-row
   count. Do this before designing any SQL.
2. Design purpose-specific browser-safe `api.crm_*` aggregate and recent-row
   contracts: exact counts computed server-side, bounded recent rows,
   deterministic ordering with ID tie-breakers, `app.has_app_access('crm')`
   authorization, only the columns actually rendered, and independently
   failure-tolerant groups where feasible.
3. Prove query plans on representative preview data with
   `EXPLAIN (ANALYZE, BUFFERS)`. Add indexes only where that evidence demands them.
4. Standard shared-db sequence: inspect dirty state and in-flight PRs, create a
   dedicated branch, add one additive idempotent timestamped migration, run
   `scripts/check-sql.sh` and the repo tests, then preview dry-run, apply, and
   verify.
5. Open the PR with SQL, tests, EXPLAIN output, access-control proof, and preview
   evidence attached.

HARD STOP: stop at the preview-proven gate. Do NOT apply to production and do NOT
merge. Phase 6's production approval is spent and authorizes nothing here. When
preview and review both pass, come back to Albert with one request naming the
exact SHA, migration version, recorded review, and expected objects, and wait.

Verification gate, all of which must be true before you report done:

- A CRM user gets correct data from the preview contracts; a valid non-CRM user is
  denied.
- Contract counts match direct preview SQL fixtures.
- EXPLAIN evidence is saved in shared-db verification docs.
- `scripts/check-sql.sh` and all shared-db checks pass.
- The shared-db worktree has no untracked migration or unexplained file.

Also record the branch, PR URL, migration filename, preview project, and preview
apply status in the shared-db handoff and in the Phase 7A row of the progress
ledger in `/worksp/popcrm-web/plan_codebase_audit_remediation.md`. Mark it
`preview complete / merge pending`, not complete.

Constraints:

- Commit identity must be `Albert Hazan <u2giants@users.noreply.github.com>`.
  Verify with `git var GIT_COMMITTER_IDENT` before the first commit.
- Do not edit or delete any other session's file in `HANDOFF.d/`.
- 1Password reads are serialized; vault `vibe_coding` only.
- If you hand any part to Codex, reasoning effort stays `low` or `medium`.
