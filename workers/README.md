# POP CRM Host Workers

This directory owns the current CRM host-side worker runtime for the shared
Supabase backend. No retired backend is required by these workers.

Runtime:

- Worker entrypoint: `workers/crm-worker-supabase.mjs`
- Host units: `systemd/popcrm-*.service` and `systemd/popcrm-*.timer`
- Secrets: mode-600 `/home/ai/.crm-worker.env`
- 1Password item: `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env`

Commands:

- `npm run crm:outlook-ingest`
- `npm run crm:reroute`
- `npm run crm:contact-sync`
- `npm run crm:summarize`
- `npm run crm:apply-ignore-rules`
- `npm run crm:fireflies-server`

The worker records unknown email domains with
`crm.record_ingested_domain(...)`. It must not insert random email domains into
`core.customer`; only human promotion through `crm.promote_ingested_domain(...)`
creates potential customers.
