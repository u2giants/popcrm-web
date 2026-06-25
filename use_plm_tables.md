# Using PLM Master Data Tables in CRM

CRM shares one Supabase database with DAM, PM/PIM, and PLM. The PLM import is now the canonical shared source for customers, licensors, and properties. CRM may add CRM-specific state, but it must not fork the shared identity layer.

## Current Source of Truth

PLM data is imported from the live Designflow API into the shared Supabase project.

- Production Supabase project: `qsllyeztdwjgirsysgai`
- Preview Supabase project: `xjcyeuvzkhtzsheknaiu`
- Shared schema repo: `u2giants/shared-db`
- Migration that created the import path: `supabase/migrations/20260624173000_plm_master_data_import.sql`
- Import tool: `tools/sync-plm-master-data.mjs`
- Import source system value: `designflow_plm`

API sources inspected before the schema was finalized:

- Customers: `https://api.designflow.app/api/core/customers/getCustomers`
- Licensors/properties: `https://api.designflow.app/api/item_master/lib/getLicensorsWithProperties`

The PLM API key is read-only and belongs only in server/admin tooling. Never put it in browser code, frontend env, logs, screenshots, fixtures, or committed docs.

## Tables CRM Should Know

Use these tables as the shared identity layer:

- `core.company`: canonical customer/company/account identity. PLM customers live here alongside CRM companies.
- `core.company_source_ref`: PLM customer lineage. For PLM customers, use `source_system = 'designflow_plm'` and `source_table = 'customers'`.
- `core.licensor`: canonical licensor identity.
- `core.property`: canonical property identity, linked to `core.licensor` by `licensor_id`.
- `core.taxonomy_source_ref`: PLM lineage for licensors and properties. For PLM rows, use `source_system = 'designflow_plm'` and `source_table = 'merchGroup'`.
- `plm.customer_import`, `plm.licensor_import`, `plm.property_import`: PLM-shaped import snapshots linked to canonical IDs. These are not CRM-owned working tables.
- `ingest.sync_run`, `ingest.raw_record`: raw import audit trail. Do not query these from the browser.

Production was populated on 2026-06-25 with 55 PLM customers, 37 licensors, 468 properties, and 560 raw ingest records. The import redacts `customers_passw`; stored raw records should not contain that field.

## How CRM Should Use The Data

CRM account/customer UI should continue to treat `core.company` as the account identity. CRM-specific fields such as account status, segmentation, owner assignment, sales notes, opportunity state, departments, or routing rules belong in CRM-owned tables/views keyed to `core.company.id`.

Contacts remain contact data, not PLM customer data. Use the existing CRM contact/account relationship contracts (`core.contact`, `core.contact_company`, and CRM/API views). The PLM import does not import buyers, contacts, or CRM relationship history.

When CRM needs to know whether an account came from PLM, join to `core.company_source_ref`:

```sql
select
  c.id,
  c.name,
  csr.source_id as plm_customer_id,
  csr.source_code as plm_customer_code
from core.company c
join core.company_source_ref csr on csr.company_id = c.id
where csr.source_system = 'designflow_plm'
  and csr.source_table = 'customers';
```

If opportunities, approvals, or account screens need licensor/property pickers, use `core.licensor` and `core.property` with PLM source refs. If the browser needs a stable CRM-shaped contract, add an `api.crm_*` view/RPC in `u2giants/shared-db` rather than querying internal import tables directly.

## What Not To Do

- Do not create a CRM-owned duplicate customer table as the canonical account source.
- Do not store CRM workflow state in `plm.customer_import` or the source-ref tables.
- Do not write to `plm.*_import`, `core.*_source_ref`, or `ingest.*` from CRM UI code.
- Do not change PLM source refs, `source_system`, or `source_table` values. The future PLM database cutover depends on those stable keys.
- Do not expose the PLM API key to the frontend. Import refreshes belong in server/admin tooling.
- Do not read `ingest.raw_record` from browser code.
- Do not point CRM pickers at unreviewed raw/import tables when an `api.crm_*` contract exists or should be created.
- Do not edit the mirrored `shared-db/` folder inside this app repo. Shared schema changes belong in canonical `u2giants/shared-db`.
- Do not rename/drop shared tables, columns, views, or policies from an app repo.

## If CRM Needs More Fields

If CRM needs app-specific data, add CRM-owned extension tables or columns that FK to the canonical rows. Examples: account segmentation keyed to `core.company.id`, opportunity/account licensor references keyed to `core.licensor.id`, or product/property interest keyed to `core.property.id`.

If CRM needs a new shared browser contract, make a timestamped migration in `u2giants/shared-db`, apply it to preview first, verify the CRM screen against preview, then promote to production through the shared-db workflow.

## Documentation Rule

When changing how CRM uses these PLM tables, document both sides:

- In this repo: update the relevant CRM docs, API notes, or this file.
- In `u2giants/shared-db`: update schema/API docs if the change affects shared tables, RLS, views, RPCs, imports, or cross-app data contracts.

Future sessions should start by checking this file, `AGENTS.md`, and the canonical `shared-db` docs before changing account/customer/licensor/property behavior.
