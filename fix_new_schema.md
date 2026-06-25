# fix_new_schema.md — popcrm-web (CRM) shared-schema migration

**Read this top to bottom before changing anything. It assumes you have zero prior
context.** It explains what changed in the shared Supabase database, what *this*
app must change, what it should change for correctness, and what NOT to touch.
Every path below is in **this** repo (`popcrm-web`). Do **not** edit the vendored
`shared-db/` folder — it is a read-only auto-synced copy.

---

## 1. What changed in the shared database (and why)

The shared Supabase Postgres backend was restructured so the canonical customer
table holds **only customers**, and email-domain noise is kept out of it.

1. **`core.company` was hard-renamed to `core.customer`.** There is **no
   `core.company` anymore** — not even a compatibility view. "Company" was the
   wrong bucket (factories and licensors are companies too, and have their own
   tables `core.factory` / `core.licensor`).
2. **New column `core.customer.is_potential`** (boolean). `false` = active /
   confirmed customer (exists in PLM/ERP — has a `designflow_plm`/`coldlion`
   source ref). `true` = potential customer (CRM/PM created, not yet in ERP). A
   DB trigger keeps it correct automatically. This is the *authoritative* "have
   we done business with them" signal, separate from the subjective
   `customer_status` enum.
3. **Email domains are no longer customers.** Every domain seen in ingested email
   now lives in a new CRM-private table **`crm.ingested_domain`** — NOT in
   `core.customer`. A domain only becomes a `core.customer` row (a *potential*
   customer) when a human promotes it. New helpers:
   - RPC `crm.record_ingested_domain(p_domain, p_sender, p_subject, p_display_name)`
     — the email/Fireflies worker records noise here; it must **not** create a
     customer.
   - RPC `crm.promote_ingested_domain(p_domain, p_name)` — promotes a domain to a
     potential `core.customer`. Returns the new customer id.
   - View `api.crm_ingested_domain_list` — browser-safe list of ingested domains
     for the triage screen.
4. **`api.crm_account_list` now also exposes an `is_potential` column.** The RPC
   `api.crm_update_account(...)` now returns a `core.customer` row (same columns
   as before, plus `is_potential`); its **parameter names are unchanged** (still
   `p_company_id`, etc.).

Full rationale: `shared-db/docs/shared-database-vision.md` → "Customer vs.
Company vs. Ingested Domain".

---

## 2. Good news: this app does NOT break at runtime

`popcrm-web` reads through `api.crm_*` **views** and writes through `api.crm_*`
**RPCs**. Those object **names did not change**, and the views/RPCs were recreated
to point at `core.customer` internally. So at runtime the app keeps working after
the rename. The only thing that breaks is the **generated TypeScript types** at
build time (they describe a `company` table that no longer exists).

That means there is **no tight production-cutover window for this app** (unlike PM
/ `poppim-web`, which queries `core.company` directly). You can ship the types
regen on your normal schedule. Still do the §5 correctness work to actually use
the new model.

---

## 3. Required: regenerate the Supabase types

`src/lib/database.types.ts` currently describes the old schema:
- the `company` table type around **lines 1167–1232**,
- the satellite `company_source_ref` around **lines 1233–1244** (this table keeps
  its name — only its target was renamed),
- `crm_update_account` returning `Database["core"]["Tables"]["company"]["Row"]` at
  **line ~651**.

Regenerate it so `company` → `customer`, the RPC return type updates, and the new
`api.crm_ingested_domain_list` view + `is_potential` appear:

```bash
supabase login          # or export SUPABASE_ACCESS_TOKEN=<token from owner/1Password>
supabase gen types typescript --project-id qsllyeztdwjgirsysgai --schema app,core,crm,api > src/lib/database.types.ts
```
> Generate from **production** only after prod has been renamed. To regenerate
> beforehand, target the **preview** branch which already has the new schema:
> `--project-id xjcyeuvzkhtzsheknaiu`.

Then `npm run build` and fix any compile errors where code used the old `company`
row type — switch those to the `customer` type. (Reads go through views, so there
should be few or none.)

---

## 4. What did NOT change — do NOT "fix" these

- **`api.crm_*` view names** (`crm_account_list`, `crm_contact_list`,
  `crm_opportunity_list`, `crm_email_routing_queue`, etc.) — unchanged. Keep using
  them.
- **`api.crm_update_account` parameters** — still `p_company_id`, `p_name`,
  `p_domain`, `p_customer_status`, `p_chain_type`, `p_routing_aliases`,
  `p_so_patterns`. Your call site `src/features/crm/api.ts:409` needs no parameter
  changes.
- **`customer_status` column** (`ACTIVE_CUSTOMER` / `POTENTIAL_CUSTOMER` / `OTHER`
  / `UNASSIGNED`) still exists. Your `constants.ts` enums, `customerStatusLabel`,
  `customerStatusTone`, and segment filtering keep working.
- **`company_id`, `company_name`, `company_customer_status`** fields on the
  `crm_*` views — unchanged. Your adapters (`src/features/crm/api.ts` ~215/241/278,
  429/441) keep working.

---

## 5. Recommended: wire the new ingested-domain model (the real point of the change)

The whole reason for this change is that the **Triage / "New Companies"** queue
should be backed by `crm.ingested_domain`, not by `core.customer` rows with
`customer_status = UNASSIGNED`. Today the app conflates them. Update it:

### 5a. Point the triage/ingested-domain read at the new view
`src/features/crm/api.ts`:
- `applyAccountSegment()` (~lines 127–131) currently does
  `q.or('customer_status.eq.UNASSIGNED,customer_status.is.null')` for the `triage`
  segment. The triage queue should instead come from
  `api.crm_ingested_domain_list`.
- `fetchIngestedDomains()` (~line 388) currently queries `crm_account_list` — it
  is misnamed/misrouted. Repoint it to:
  ```ts
  supabase.schema('api').from('crm_ingested_domain_list').select('*').order('last_seen_at', { ascending: false })
  ```
  Columns available: `id, domain, display_name, status, email_count,
  first_seen_at, last_seen_at, last_sender, sample_subject, promoted_customer_id,
  promoted_company_name, updated_at`.

### 5b. Keep the curated Accounts tabs on `crm_account_list`
The **Customers** / **Not a customer** / **All** tabs stay on
`api.crm_account_list` filtered by `customer_status`. Only **Triage** ("New
Companies") moves to the ingested-domain view. Update
`src/features/crm/pages/AccountsPage.tsx` (segment logic ~lines 30–39, 105–106)
and the query hooks/keys in `src/features/crm/queries.ts`
(`crmKeys.ingestedDomains`, `useIngestedDomainsQuery`, and the invalidations in
`useUpdateAccountMutation` ~lines 295–318) so the triage tab uses the new source.

### 5c. Promotion action
When a user upgrades a triaged domain to a tracked account, call the promote RPC
instead of inserting/patching a `core.customer` row:
```ts
await supabase.schema('crm').rpc('promote_ingested_domain', { p_domain, p_name })
// returns the new core.customer id; it is created as a POTENTIAL customer (is_potential = true)
```
(If `crm` isn't exposed to PostgREST in your client config, add a thin
`api.crm_promote_ingested_domain` wrapper in shared-db and call that instead —
coordinate with the shared-db owner.)

### 5d. Surface potential vs active
`api.crm_account_list` now returns `is_potential`. Use it (e.g. a chip) to show
which customers are PLM/ERP-confirmed (`is_potential = false`) vs. potential
(`true`). Treat `is_potential` as authoritative for "real customer," and keep
`customer_status` for the CRM's own triage state. Consider updating
`customerStatusTone`/`customerStatusLabel` in `src/features/crm/constants.ts` so
"Potential Customer" is driven by `is_potential` rather than only the enum.

---

## 6. The email / Fireflies worker (NOT in this repo)

The ingestion worker that creates company rows from incoming email is **not in
this repo** — it runs externally (`crm-fireflies.designflow.app`, deployed from
`u2giants/directus`). That worker must be updated separately to call
`crm.record_ingested_domain(p_domain, p_sender, p_subject, p_display_name)`
instead of inserting into `core.company`/`core.customer`. Flag this to whoever
owns that worker; this app can't fix it. (This app only has a Fireflies *health
check*, `FIREFLIES_HEALTH_URL` in `constants.ts` — no ingestion code.)

---

## 7. How to verify

```bash
npm install
npm run dev   # point .env at preview xjcyeuvzkhtzsheknaiu to test the new schema
```
- Accounts → **Customers** tab loads (via `crm_account_list`).
- Accounts → **Triage** tab shows ingested domains (after §5) from
  `crm_ingested_domain_list`.
- Promote a triaged domain → it appears as a potential customer.
- Edit an account (status/chain) → `crm_update_account` still works.
- `npm run build` passes with regenerated types.

---

## 8. Docs in this repo to update

- `docs/architecture.md` — add/adjust the data-model section (there is a prepared
  draft in `shared-db/docs/_drafts/popcrm-web-architecture-company-vs-customer.md`
  you can adapt; do not edit it in place — copy the prose into your own
  `docs/architecture.md`).
- `AGENTS.md` — the entity table (~lines 185–187) and `AccountsPage` description
  (~line 107): `core.company` → `core.customer`; note `is_potential` and that
  Triage is backed by `api.crm_ingested_domain_list`.

---

## 9. Commit rules

App repos **commit straight to `main`** (no branches), build must pass, push, CI
deploys. Don't touch `shared-db/` (auto-synced). Fix-forward or revert on `main`.

## 10. Checklist

- [ ] Regenerate `src/lib/database.types.ts`; `npm run build` passes
- [ ] (recommended) Triage tab → `api.crm_ingested_domain_list`
      (`api.ts` `applyAccountSegment`/`fetchIngestedDomains`, `AccountsPage`,
      `queries.ts`)
- [ ] (recommended) Promotion via `crm.promote_ingested_domain`
- [ ] (recommended) Surface `is_potential` (chip + `constants.ts` tone/label)
- [ ] Update `docs/architecture.md` + `AGENTS.md`
- [ ] Flag the external Fireflies worker owner to use `crm.record_ingested_domain`
- [ ] Verify Accounts/Triage/edit flows on preview
