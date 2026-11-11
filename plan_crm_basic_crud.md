---
summary: CRM basic CRUD plan: add/delete/merge contacts, programs, notes, tasks, customers; steps 0-11 all live-proven 2026-11-06.
kind: plan
status: done
read-when: changing contact/program/customer create, archive, or merge flows
---
# Plan — CRM basic add / delete / merge gaps

Issue: https://github.com/u2giants/popcrm-web/issues/24 · Handoff: [HANDOFF.d/2026-11-05T2105Z-hetz-claude-crm-basic-crud-plan.md](HANDOFF.d/2026-11-05T2105Z-hetz-claude-crm-basic-crud-plan.md)

## STATUS (read first — do not re-plan)

| # | Step | State | Evidence |
|---|------|-------|----------|
| 0 | Prove live write permissions per table | ✅ done 2026-11-05 | results in §5 (read-only SQL, prod `qsllyeztdwjgirsysgai`) |
| 1 | Shared-db: archive/delete + create/merge RPCs | ✅ done 2026-11-06 3:19 PM EST — LIVE in production | production ledger carries `20261106144500`+`20261106144600` (apply run 42287178690 success, tip f1736f47); path: PR #5857 (renames above the then-max) + lane repair PR #5903 (rename authorship proof) + historical-recovery dispatch; RPC fix-forward `20261106212400` (PR #5927: manual programs need a distinct external pair — NULLS NOT DISTINCT key) live 6:51 PM EST, apply run 42314544737 |
| 2 | Add contact | ✅ done 2026-11-06 — live-proven | e2e on crm.designflow.app (deploy 50b84717): contact added via dialog, appears in grid |
| 3 | Delete (archive) contact | ✅ done 2026-11-06 — live-proven | e2e live: archived, gone from grid |
| 4 | Merge duplicate contacts | ✅ done 2026-11-06 — live-proven | e2e live: both notes moved to kept contact, duplicate archived |
| 5 | Edit contact scope | ✅ done 2026-11-06 — live-proven | e2e live: scope → COMPANY_WIDE, saved, reopens as such |
| 6 | Add program | ✅ done 2026-11-06 — live-proven | e2e live after fix `20261106212400`: program created, appears in programs grid (second manual create had hit the external-key constraint live; fixed and re-proven) |
| 7 | Delete (archive) program | ✅ done 2026-11-06 — live-proven | e2e live: archived via modal Delete, gone from grid |
| 8 | Delete note / task / meeting | ✅ done 2026-11-06 — live-proven | e2e live: task + note deleted, gone; meeting delete guarded off on production (real data; no fixture) — proven by unit + contract tests |
| 9 | Add task from Tasks page | ✅ done 2026-11-06 — live-proven | e2e live: task created from Tasks page, appears, then deleted (assignee field omitted: only an admin-gated RPC can list profiles; flagged below) |
| 10 | Delete (archive) customer | ✅ done 2026-11-06 — live-proven | e2e live: refusal shown for customer with open program; archive verified in DB (`crm.customer_ext.archived_at`) |
| 11 | Live proof + docs | ✅ done 2026-11-06 7:05 PM EST | all gates PASS on https://crm.designflow.app (`/version.json` = 50b84717); fixtures cleaned to zero active E2E rows (verified by SQL count); ai-admin crm access re-revoked |

Fresh session starts at **Step 0**. Update 2026-11-06: a separate session shipped "defunct" contacts (quit/transferred/retired, stored in `crm.contact_ext`, admin and sales only per Albert) — Step 3 must build on that, not duplicate it; read AGENTS.md/docs for its notes. Already done (not in this plan): contact
editing of name/email/phone/title/customer, commit `56300434` on `main`, live at
https://crm.designflow.app (`/version.json` showed `9e801d67`, 2026-11-05 3:55 PM EST).

---

## Part 1 — Why

### 1. Ultimate goal
Albert (owner, POP Creations; not a programmer) found the CRM missing basics any
CRM has. When done, a salesperson can, from the normal screens and without asking
anyone: **add a contact, remove a contact, merge two duplicate contacts, set a
contact's scope, add a program (deal), remove a program, remove a note, task or
meeting, add a task from the Tasks page, and remove a customer** — and nothing
"removed" by mistake is lost forever.

**If a step conflicts with this goal, the goal wins — stop and flag it.**

### 2. What this application is
- `popcrm-web` (GitHub `u2giants/popcrm-web`): React + Vite + TypeScript SPA,
  TanStack Query, shadcn-style UI (`src/components/ui/*`), sonner toasts. The
  POP CRM frontend (not PIM).
- Data: shared POP Supabase project `qsllyeztdwjgirsysgai` (production). Reads
  come from views in schema `api` (`crm_*_list`); writes are either RPCs in
  `api` (`crm_update_contact`, `crm_create_customer`, `crm_update_customer`,
  `crm_set_opportunity_stage`, merge) or direct table writes on schema `crm`
  via `insertReturning` / `updateRow` in `src/features/crm/api.ts:230-247`.
- Contacts live in `core.contact`, customers in `core.company` (shared master
  data used by other apps — PIM, DAM). Programs = `crm.opportunity`. Notes/
  tasks/meetings/departments in `crm.*`.
- Schema/permission source of truth: repo `popcre/shared-db` (local canonical
  checkout `/worksp/shared-db`, landing-only — use a worktree).
- Deploy: push to `main` → GitHub Actions `Build and Deploy` → GHCR → Coolify.
  Live proof: `https://crm.designflow.app/version.json` `git_sha` equals the commit.

### 3. What triggered this
2026-11-05 Albert: "the system doesn't have the most basic function of a CRM:
editing a contact's details" (fixed), then asked what else is basic and missing,
then "make a plan to add all the functionality you mentioned." The audit
(write functions in `src/features/crm/api.ts`, mutation hooks in
`src/features/crm/queries.ts`) found the gaps in §4.

### 4. Scope
In: the 10 capabilities in §1 (Steps 2–10), plus the shared-db RPCs they need (Step 1).

NOT in this plan: bulk delete from grids; undo/restore UI for archived records
(restore stays an admin SQL task, recorded per step); deleting departments
(already exists in Data Admin, `DataAdminPage.tsx:405`); creating meetings
(they come from Fireflies); merging programs; permissions/role redesign;
any PIM/DAM change.

## Part 2 — What we already know

### 5. Current state

**Step 0 results (2026-11-05, read-only SQL on production `qsllyeztdwjgirsysgai` via
Supabase management API):**

Privileges for role `authenticated` (RLS on everywhere; write policies =
`app.has_role('administrator') or app.has_any_role(array['sales','licensing'])`):

| Table | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|
| `core.contact` | ✗ | ✗ | ✗ | admin_write/shared_read policies; RPC only |
| `core.contact_company` | ✗ | ✗ | ✗ | same; carries `scope`, `crm_department_id`, `contact_type`, `title` |
| `core.customer` | ✗ | ✗ | ✗ | same (plan said `core.company` — actual table is `core.customer`) |
| `crm.customer_ext` | ✗ | ✗ | ✗ | write policy exists but no grant; RPC only |
| `crm.opportunity` | ✓ | ✓ | ✓ | direct writes allowed for sales/licensing/admin |
| `crm.note` | ✓ | ✓ | ✓ | same |
| `crm.task` | ✓ | ✓ | ✓ | same |
| `crm.meeting_note` | ✓ | ✓ | ✓ | same |

Archive columns decided:
- Contact: `core.contact.status` enum `entity_status` =
  `active|inactive|archived|deleted|potential`; all 8850 rows are `active`; **no
  non-CRM view filters contact.status** → archive = `status='archived'`; CRM
  views add `ct.status <> 'archived' and ct.status <> 'deleted'`.
- Customer: PIM `api.pm_customer_list` filters `c.status IN
  ('active','potential')` → archiving via core.status would hide customers from
  PIM. Archive CRM-only instead: upsert `crm.customer_ext.status='archived'`;
  CRM customer views exclude ext-archived. `api.crm_customer_picker_list`
  already uses this exact `COALESCE(x.status,'active')='active'` pattern.
- Opportunity/program: `crm.opportunity.status` free text, unused by frontend,
  0 rows live → archive = `status='archived'`; views filter it.
- Note/task/meeting: no status column, **no inbound FKs** → hard DELETE via
  direct table delete (grants + RLS already allow).

Inbound FKs on `core.contact` (merge must repoint): `contact_company`
(cascade; UNIQUE(contact_id, company_id, relationship_type) — delete drop's row
when keep collides), `contact_source_ref` (cascade; unique key not
contact-scoped, safe repoint), `vendor_contact` (cascade; UNIQUE
NULLS NOT DISTINCT(factory_id, contact_id, role) — collision-delete),
`crm.department.primary_contact_id` (set null), `crm.email_message.contact_id`,
`crm.meeting_note.contact_id`, `crm.note.contact_id`, `crm.opportunity.contact_id`,
`crm.task.contact_id` (all set null), `pim.product.contact_id`,
`pim.project.contact_id` (set null). `core.contact.email` has **no unique
index** (citext) — duplicate check must be a query inside `crm_create_contact`.

Scope values (live): `core.contact_company.scope` ∈ {`COMPANY_WIDE` (875),
`DEPARTMENT` (55)}; no DB check constraint; frontend `label()` renders them.
Stages: `crm.opportunity` 0 rows live; frontend `OPPORTUNITY_STAGES` is the
allowed set. `crm_update_contact` exists (admin/sales/licensing check inside);
`crm_set_opportunity_stage` is the RPC pattern to copy.

CRM list views needing an archived filter: `crm_contact_list`,
`crm_contact_segment_list`, `crm_contact_segment_counts`, `crm_customer_list`,
`crm_customer_overview`, `crm_customer_picker_list` (has it already),
`crm_opportunity_list`. `crm_task_list`/`crm_note_list`/`crm_meeting_list` need
none (hard delete).

- Exists: `createCustomer`, `mergeCustomers`, `createDepartment`,
  `deleteDepartment` (direct `crm.department` delete), `createNote`,
  `createTask` (API exists, used only from Data Admin), `createIgnoreRule`;
  update for contact, customer, department, email, meeting, note, opportunity,
  task, approval. Mutation hooks: `queries.ts` (`useUpdateContactMutation`
  at ~line 578 is the pattern to copy, including its cache invalidations).
- Missing everywhere (UI and backend): create contact, delete contact, merge
  contacts, create opportunity, delete opportunity/note/task/meeting/customer.
- Contact card: `src/features/crm/components/ContactDrawer.tsx` (Edit/Save
  form added 2026-11-05; scope shown read-only). Other drawers:
  `CustomerDrawer.tsx`, `OpportunityDrawer.tsx`, `NoteDrawer.tsx`,
  `TaskDrawer.tsx`, `MeetingDrawer.tsx`. Merge UI to copy:
  `MergeCustomersDialog.tsx` (+ its test). Create UI to copy:
  `CreateCustomerDialog.tsx`. Pages in `src/features/crm/pages/`.
- `updateBuyer` (`api.ts:819`) already sends `p_scope` / `p_clear_scope` to
  `crm_update_contact` — scope edit needs UI only, once allowed values are known.

### 6. Key findings
- The `authenticated` role was granted `select on all tables in schema crm`
  in migrations; yet direct `updateRow`/`insertReturning` writes work today, so
  later per-table grants/RLS exist. **Live grants were not proven** — Step 0.
- `core.contact` is referenced by other tables: 8 FKs `on delete set null`,
  3 `on delete cascade` (shared-db migrations). A hard delete would silently
  erase cascaded rows and blank links → use archive.
- Duplicate contacts are real (e.g. `'Holly Price'` with quote marks, Contacts grid).
- Scope values: shown via `label()` (`format.ts:31`), e.g. "Company Wide"; the
  allowed set is a DB check/enum — read it in Step 0, never hard-code a guess.

### 7. Rejected approaches
- **Hard `DELETE` of contacts/customers/programs** — cascades and shared
  master data used by PIM/DAM; irreversible. Rejected for archive (soft delete).
- **App-repo migrations** — forbidden; all schema/RPC changes go to `popcre/shared-db`.
- **Direct table inserts into `core.contact`** from the SPA — bypasses the
  RPC validation pattern used by `crm_update_contact`; use RPCs.
- **Widening `authenticated` grants on core tables** — use `security definer`
  RPCs with explicit checks instead.

### 8. Decisions
Locked (2026-11-05): remove = archive (hidden from lists, recoverable) for
contact, customer, program; RPC for every core/opportunity write; confirm dialog
before any remove; a contact merge moves emails/meetings/notes/tasks links to
the kept contact and archives the other. Notes/tasks may hard-delete if they
have no dependents (Step 0 decides; archive otherwise).
Open (implementer's judgment): exact column used for archive (reuse an existing
`archived_at`/`is_active`/status column if present, else add `archived_at`);
dialog layout; whether "Delete" sits in a drawer footer or an overflow menu
(prefer the drawer footer beside Edit, matching `ContactDrawer`).

## Part 3 — How to build it

### 9. Steps
Phase cut points: after Step 1 (shared-db lands and promotes), after Step 5, after Step 9.
Re-read the remaining steps before each phase.

**Step 0 — Prove live permissions and columns.** Read-only SQL against
production (service role from `/home/ai/.crm-worker.env`, `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY`; or the Supabase skill): for `core.contact`,
`core.company`, `crm.opportunity`, `crm.note`, `crm.task`, `crm.meeting*`
list `has_table_privilege('authenticated', t, 'INSERT/UPDATE/DELETE')`, RLS
policies (`pg_policies`), archive-like columns, inbound FKs with delete rules,
and the scope constraint values. Write results into §5 of this plan.
Gate: a table in §5 listing each table × privilege × policy.

**Step 1 — shared-db RPCs** (load skill `shared-db-change`; claim objects on
its issue; worktree of `/worksp/shared-db`). Add, as `security definer`
functions in schema `api` with `crm` access checks matching `crm_update_contact`:
`crm_create_contact(p_full_name, p_email, p_phone, p_job_title, p_company_id,
p_crm_department_id, p_scope) returns uuid` (reject blank name, malformed email,
duplicate email case-insensitive → error naming the existing contact);
`crm_archive_contact(p_contact_id)`; `crm_merge_contacts(p_keep_id, p_drop_id)`
(repoint every FK found in Step 0, fill blank fields on keep from drop, archive
drop, one transaction, reject keep = drop); `crm_create_opportunity(...)`;
`crm_archive_opportunity(id)`; `crm_archive_customer(id)` (reject if it has
non-archived programs — return a clear message); delete/archive for note, task,
meeting per Step 0. List views (`api.crm_*_list`) must exclude archived rows.
Gate: shared-db tests for each function pass in preview; automatic promotion
reaches production; `select` of each function in production succeeds.

**Step 2 — Add contact.** `api.ts`: `createContact` calling the RPC then
reading back from the contact list view (pattern: `createCustomer`).
`queries.ts`: `useCreateContactMutation` (same invalidations as update).
UI: `CreateContactDialog.tsx` (copy `CreateCustomerDialog`) with name, email,
phone, title, customer, department; "Add contact" button on
`ContactsPage.tsx` header. Gate: add "Test Contact <timestamp>" in the browser,
it appears in the grid; then archive it (Step 3).

**Step 3 — Remove contact.** "Delete" button in `ContactDrawer` footer → confirm
dialog naming the contact → `crm_archive_contact` → close drawer, row gone.
Gate: archived test contact absent from grid and from `api` list view.

**Step 4 — Merge contacts.** `MergeContactsDialog.tsx` (copy
`MergeCustomersDialog`): pick the duplicate, preview which fields win, confirm.
Entry: "Merge" in `ContactDrawer` footer and when exactly two grid rows are
selected. Gate: merge two test contacts each with one note; kept one shows both notes.

**Step 5 — Scope edit.** Add a Scope picker to the edit form in
`ContactDrawer.tsx` using the Step 0 values; `updateBuyer` already supports it.
Gate: change, save, reopen shows the new scope; change back.

**Step 6 — Add program.** `createOpportunity` (RPC) + hook + "New program"
button on `ProgramsPage.tsx`/`PipelinePage.tsx`, dialog with name, customer,
stage, amount, close date. Gate: created test program appears in its stage.

**Step 7 — Remove program.** Delete in `OpportunityDrawer.tsx` with confirm.
Gate: test program gone from pipeline.

**Step 8 — Remove note/task/meeting.** Delete in `NoteDrawer`, `TaskDrawer`,
`MeetingDrawer` with confirm. Gate: each test record gone after reload.

**Step 9 — Add task from Tasks page.** Hook `useCreateTaskMutation` over
existing `createTask` (`api.ts:994`); "New task" button + dialog on
`TasksPage.tsx` (title, due date, assignee, customer/contact). Gate: created
task appears, then delete it via Step 8.

**Step 10 — Remove customer.** Delete in `CustomerDrawer.tsx`; show the RPC's
refusal message when programs exist. Gate: archive a test customer; refusal
shown for a customer with programs.

**Step 11 — Live proof.** After deploy, repeat the gates on
https://crm.designflow.app as a real user and clean up every test record.

Adversarial cases (user input crosses into shared master data):

| Input | Hostile case | Test |
|---|---|---|
| new contact name | blank / whitespace | shared-db test `crm_create_contact rejects blank name`; UI test `CreateContactDialog blocks empty name` |
| new contact email | malformed, or duplicate in other case | `crm_create_contact rejects bad email`, `... rejects duplicate email` |
| merge ids | keep = drop; drop already archived; non-existent id | `crm_merge_contacts rejects self/archived/missing` |
| archive id | already archived / missing / other app's row without crm access | `crm_archive_* is idempotent and rejects missing` + access test |
| customer archive | customer has open programs | `crm_archive_customer refuses with open programs` |
| any text field | 10k chars, SQL/HTML text | `crm_create_contact stores text literally`; UI renders escaped (React default) |

### 10. Tests
New: shared-db tests named in the table above; frontend vitest:
`CreateContactDialog.test.tsx` (validation, submit payload),
`MergeContactsDialog.test.tsx` (field preview, keep≠drop), a confirm-dialog test
per drawer delete. Must stay green: `npm test`, `npx tsc -b --noEmit`,
`npx eslint src`, `npm run build`.

### 11. Constraints and gotchas
- Schema changes only via `popcre/shared-db` and its automatic promotion; no
  manual production commands. Production SQL in Step 0 is read-only.
- popcrm-web: commit straight to `main` (single-branch model, `CLAUDE.md`).
- Remove must never be one click: always a confirm naming the record.
- Grids hold data in TanStack Query; invalidate the same keys as
  `useUpdateContactMutation` or the row lingers.
- Drawers keep the row they opened with (see `ContactDrawer` `edited` state);
  close the drawer after a remove.
- Visual verification required for every UI step.
- Times to Albert in EST. Sign GitHub posts with `$AI_GH_SIGNATURE`.

### 12. Access and environment
- Local run: `.env` with `VITE_SUPABASE_URL=https://qsllyeztdwjgirsysgai.supabase.co`
  and `VITE_SUPABASE_ANON_KEY` from 1Password vault `vibe_coding`, item
  "Supabase Runtime Keys - shared POP database (production)" field
  `SUPABASE_ANON_KEY` (item id `3hhxwrljnaq2tykxi7hplq5ryi`; parentheses in the
  title break `op://` refs — use the id). `npx vite --port 5199`. Delete `.env` after.
- Logged-in browser test: memory note "verify-spa-as-user-supabase-session"
  (mint a magic-link session with the service role, inject into localStorage
  key `sb-qsllyeztdwjgirsysgai-auth-token`). Playwright MCP may be down;
  `npm i playwright` in the scratchpad works with the cached Chromium.
- `gh` authenticated as `u2giants`.

## Part 4 — Landing it

### 13. Done, risks, open questions
Done when: every STATUS row cites a commit or CI run; shared-db functions live in
production; `npm test`/build green; `/version.json` on crm.designflow.app shows
the final commit; Step 11 gates pass on live; test records cleaned up; this
plan's STATUS updated and the handoff closed.
Risks: merge repointing misses a FK → Step 0 inventory is mandatory; archived
rows leaking into lists or other apps' views → check PIM/DAM views that read
`core.contact`/`core.company` filter archived rows (flag to shared-db issue if
not). Rollback: revert the frontend commit; archived rows are restorable by
clearing the archive column.
Open: whether other apps should hide CRM-archived contacts/customers — if
shared-db reviewers say archive must be CRM-only, add a `crm` side flag instead;
decision criterion: does PIM/DAM depend on those rows.

---

## Self-audit (2026-11-05)
1. Fresh session executes without asking? Yes — §2, §5, §9 Step 0, §12 give
   repos, files, access, and the first action; unknowns (grants, scope values,
   archive column) are explicit Step 0 discoveries, not assumptions.
2. All background and ruled-out options? Yes — §3, §6, §7 (hard delete, app
   migrations, direct core inserts, widened grants).
3. Goal clear enough to steer? Yes — §1 lists the ten user outcomes and the
   "nothing lost" rule; §8 marks locked vs open.
