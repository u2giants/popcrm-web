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

The CLI module is import-safe: importing it for tests or reuse does not read the
worker environment file, validate runtime secrets, create a Supabase service
client, dispatch a command, or bind a port. Runtime initialization happens only
when the file is executed through the commands above. The current no-command
smoke result remains the required Supabase configuration error because runtime
configuration is intentionally validated before command dispatch.

Focused worker tests run as part of `npm test`. Injectable boundaries for
service authentication, HTTP body reads, Fireflies signatures, upstream fetch,
Graph cursor storage, and current time live in `workers/lib/worker-foundation.mjs`.

The worker records unknown email domains with
`crm.record_ingested_domain(...)`. It must not insert random email domains into
`core.customer`; only human promotion through `crm.promote_ingested_domain(...)`
creates potential customers.
