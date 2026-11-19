---
issue: none        # 41 open issues carry this work; proof of done = zero open issues with label audit-2026-11 and the 3 advisories closed or published
status: OPEN
owner: claude session 9d320254 (hetz), 2026-11-18
---

# Handoff — November 2026 codebase audit: 44 problems filed, zero fixed

Written 2026-11-18 10:40 PM EST. Owner: Albert Hazan (POP Creations). Repo
`u2giants/popcrm-web` (PUBLIC), branch `main` (single-branch model).

## 0. BUSINESS DECISIONS ONLY THE OWNER CAN MAKE

Put any new business question to Albert in ONE message before starting work.

**Open — a wrong guess is recoverable:**

- **Which fixes to start, and when.** Asked 2026-11-18 10:26 PM EST ("Start the
  five fix-first repairs now?"); Albert closed the session without answering.
  Recommendation: yes — start the five `priority: P1` issues (#32–#36), because
  each can lose or change real customer data. Blocks nothing technically; it is
  the go-ahead for all fix work, which Albert has not yet requested.

**Already settled — do NOT re-ask:**

- 2026-11-18 10:26 PM EST, Albert's exact words: "Yes, admins only" — the whole
  Data Admin page becomes administrators-only; non-admin staff no longer create
  departments or edit logos there. Recorded as LOCKED in §8 of advisory
  GHSA-g8cx-p8pj-jhw4.

Nothing else in this workstream needs the owner.

## 1. What this application is

POP CRM is POP Creations' internal customer-relationship tool for sales staff:
customers, contacts, programs (deals), tasks, notes, meetings, and email that
is pulled from Outlook mailboxes and routed automatically to the right
customer. Front end: Vite + React + TypeScript single-page app served by nginx,
live at the Coolify app `popcrm-web` (deployment and URLs:
https://github.com/u2giants/popcrm-web/blob/main/AGENTS.md → Deployment). Data:
the shared Supabase database (schema `crm`), owned structurally by
`popcre/shared-db`. Background jobs: Node scripts under
https://github.com/u2giants/popcrm-web/tree/main/workers run by systemd timers
on the host (Outlook ingest, 6-hourly re-routing, AI summaries, Fireflies
meeting notes).

## 2. What we set out to do, and why

Albert's request, verbatim: "pull the latest repo and audit the entire codebase
for bugs, inefficient code, poorly written code, and other problems. then
create an issue on github for each along with an /implementation-plan-writer to
fix it and a severity/priority". No fix was requested. Deliverable: one GitHub
issue per problem, each with a full implementation plan, a severity and a
priority.

## 3. Current state — what is true right now

- **Done and verified (2026-11-18):** 44 problems filed.
  - 41 public issues, #32–#72, all open:
    https://github.com/u2giants/popcrm-web/issues?q=is%3Aopen+label%3Aaudit-2026-11
    Each has labels `audit-2026-11`, `severity: high|medium|low`,
    `priority: P1|P2|P3`. Counts: 8 high, 29 medium, 4 low; 5 P1.
    Verified by listing: 41 open, none missing a severity or priority label,
    every body signed.
  - 3 private DRAFT repository security advisories (private because the repo is
    public), at https://github.com/u2giants/popcrm-web/security/advisories :
    GHSA-xqg7-v5v9-f4xv (text inside an email can steer where it is routed —
    medium), GHSA-g8cx-p8pj-jhw4 (Data Admin and ignore-rule settings open to
    every signed-in user — medium), GHSA-65cw-3mhm-hmjf (typed/uploaded values
    not checked — low).
- **The plan for each problem IS the issue/advisory body.** Every body is a
  complete 13-section implementation plan: STATUS table (all rows `⬜ open`),
  goal, scope, current code with file:line, root cause, rejected approaches,
  locked/open decisions, numbered steps marked `lead-only`/`helper-ok` with
  verification gates, named tests, constraints, access, definition of done, and
  a lead launch prompt. No plan files exist in the repo.
- **Not started:** every fix. No application code was changed by this session.
  The only commit is this handoff file.
- **Baseline at audit commit**
  https://github.com/u2giants/popcrm-web/commit/0870cba7 : type-check, lint and
  the full test run (25 files, 212 tests) all pass. `main` has moved since
  (25 shared-db sync commits to
  https://github.com/u2giants/popcrm-web/commit/51adc621 ); file:line
  references in the plans were taken at `0870cba7` — re-locate by function
  name if a line has shifted.
- **Not verified live:** the re-routing overwrite (#36) was proven by reading
  the code, not observed in data; the ingest-backlog problem (#63) is latent
  (no backlog exists today). The missing security/cache headers (#70) WERE
  confirmed against the live site.

The P1 issues, fix first:
- #32 Bulk-routing email domains to a customer silently drops some of them
- #33 Merge Contacts remembers a duplicate picked for a different contact
- #34 Admin 'Apply' wipes salespeople from every selected department when no person is chosen
- #35 Deleting a department silently strips it from its emails, meetings, notes and tasks
- #36 The 6-hourly re-routing job can overwrite a customer that staff assigned by hand

Other high-severity: #37 (Logos tab shows everything empty), #44 (any screen
error blanks the whole app), #63 (email ingest backlog / one bad message blocks
a mailbox).

## 4. Everything we tried that did NOT work

- **Running the background-job tests with Node's built-in runner** failed with
  import errors. They are Vitest tests, already included by
  https://github.com/u2giants/popcrm-web/blob/main/vitest.config.ts and passing
  in the normal test run. Do not "fix" them.
- **Filing every finding as its own issue** was rejected: ~90 raw findings from
  five area reviewers contained duplicates and many one-line defects. They were
  de-duplicated and small related defects grouped (e.g. #45, #59, #69), giving
  44. Do not split them back out.
- **Filing security findings as public issues** was rejected because the repo
  is public; they are private draft advisories instead.
- **Generated STATUS-table labels** were first cut at the first "." (breaking
  mid-filename); corrected before filing. Nothing to redo.
- Reviewer findings were not trusted as returned: each cited line was re-read
  by the lead before filing, and several were dropped as wrong.

## 5. Root causes and key findings

Each issue body holds its own root cause with file:line. Cross-cutting themes:
- **Writes that report success without checking what happened** (#38, #39,
  #62, #64) — delete/update calls do not check affected rows; most live in
  https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/api.ts
- **Lists fetched without a fixed order or with a hard cap** (#40, #43, #66) —
  paging in `api.ts` and row caps in
  https://github.com/u2giants/popcrm-web/blob/main/workers/crm-worker-supabase.mjs
- **Dialog state that survives between records** (#33, #51) —
  https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/MergeContactsDialog.tsx
- **Bulk actions with an unsafe empty default** (#32, #34) —
  `DomainRoutingPanel.tsx`, `AssignmentsPanel.tsx` under
  https://github.com/u2giants/popcrm-web/tree/main/src/features/crm
- **Stale cached data after edits** (#41) —
  https://github.com/u2giants/popcrm-web/blob/main/src/features/crm/queries.ts
- **Sign-in fragility** (#42) —
  https://github.com/u2giants/popcrm-web/blob/main/src/auth/auth.tsx
- **No error boundary** (#44); **table component defects** (#45, #46, #60) —
  https://github.com/u2giants/popcrm-web/blob/main/src/components/app/DataTable.tsx
- **Delivery gaps** (#70–#72) —
  https://github.com/u2giants/popcrm-web/blob/main/nginx.conf and
  https://github.com/u2giants/popcrm-web/blob/main/.github/workflows/deploy.yml

## 6. Exact next steps

1. Put the one open §0 question to Albert (start the five P1 fixes?). You'll
   know it worked when he answers yes or no.
2. On yes: open #32, read its body top to bottom, and follow its lead launch
   prompt; one worktree per issue. You'll know it worked when the issue's
   STATUS rows cite artifacts, its named tests pass, the fix is live-proven,
   and the issue is closed with a signed note.
3. Repeat for #33, #34, #35, #36 (independent of each other, except #35 and the
   Data Admin advisory both change department-delete behaviour and need
   `popcre/shared-db` work — load `shared-db-change` first and claim there).
4. Then the P2 set, high severity first (#37, #44, #63), then P3.
5. For GHSA-g8cx-p8pj-jhw4, build the admins-only gate exactly as locked in §0;
   announce to staff before it goes live (they lose access to the page).
6. When zero issues remain open under `audit-2026-11` and the three advisories
   are closed or published, delete this file in that same commit.

## 7. Constraints and gotchas in force

- Repo is PUBLIC: never put exploit detail for the three advisories in a
  public issue, PR title or commit message.
- Structural database changes never start in this repo — they start in
  `popcre/shared-db`, claim-first.
- Branching per https://github.com/u2giants/popcrm-web/blob/main/AGENTS.md :
  single-branch model on `main`; a push to `main` deploys (GitHub Actions →
  GHCR → Coolify). Production is read-only by default; SSH is break-glass only.
- Commit only as Albert's verified identity `u2giants` (never `popcre` here);
  sign everything posted to GitHub with `$AI_GH_SIGNATURE`.
- Live proof is required before any issue is closed; UI changes verified
  visually.
- Albert is not a programmer: replies to him are plain words, 120 words max.

## 8. Access and environment

- `gh` CLI authenticated as `u2giants` with rights to issues and security
  advisories on this repo.
- Secrets: 1Password vault `vibe_coding` (locations only; none were used or
  appeared in this session).
- Local run and test commands: see `AGENTS.md` linked above. Host name `hetz`.
- No shared-database claim, lock or preview stage is held by this session
  (closeout check passed 2026-11-18 10:35 PM EST).

## 9. Open questions and risks

- 2026-11-18: line numbers in plans drift as `main` moves — re-locate by
  function name.
- 2026-11-18: #36 and #63 are code-proven, not observed live; each plan's first
  step reproduces before fixing.
- 2026-11-18: the admins-only change removes a screen from non-admin staff;
  announce first.
- 2026-11-18: the three advisories are drafts and visible only to repo admins;
  a session without that right cannot read their plans.

## Part (b) — sub-agents

Five read-only reviewers (smaller model, high effort), one per area: app data
layer; screens and components; sign-in and shared UI; background jobs;
delivery/config. Each was asked to list defects with file:line and returned
findings only — no branches, PRs or worktrees, nothing left running. None
touched the database. Their findings were verified and merged by the lead into
the 44 filed items; nothing they found is unfiled except items the lead
disproved.

## Self-audit (passed)

1. Newcomer can continue without questions — §1–§3, §6, and every issue body is
   a self-contained plan.
2. As effectively as the author — §4, §5 and §9 carry the dead ends, themes and
   unverified items.
3. Every relevant detail — goal §2, state §3, failures §4, decisions §0,
   constraints §7, risks §9, next actions §6, evidence §3.
4. Owner reading only §0 sees every business decision — swept §1–§9 and part
   (b): the only owner items are the start-fixes question and the settled
   admins-only ruling; both are in §0. No technical approval is listed.
