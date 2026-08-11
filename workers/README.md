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

Configuration is validated per command before runtime clients are created or a
network port is opened. `fireflies-server` requires non-blank
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREFLIES_API_KEY`,
`FIREFLIES_WEBHOOK_SECRET`, and `OPENROUTER_API_KEY`. It exits non-zero instead
of listening if any are missing.

Fireflies Webhooks V2 is the recommended production sender. Configure only its
`meeting.transcribed` event and point it at
`https://crm-fireflies.designflow.app/s/fireflies-webhook`; subscribing to
`meeting.summarized` as well would deliver the same meeting twice. V2 sends
`event`, `meeting_id`, and `timestamp`. The worker also accepts the legacy V1
`meetingId` / `eventType` shape during migration. Other V2 events receive a
successful acknowledgement but are deliberately not ingested.

The webhook accepts only a SHA-256 HMAC in `x-hub-signature`, encoded as V2's
`sha256=<64 hex characters>` form or the legacy integration's plain
64-character hex form. Missing secrets, missing headers, malformed digests,
and mismatches are rejected.

After signature and payload validation, the endpoint returns `202 Accepted`
before transcript retrieval, routing, and database writes begin. Processing
continues in the always-on worker and logs failures without holding Fireflies'
delivery request open, satisfying V2's 10-second acknowledgement requirement.

Both public POST routes stop buffering at a configurable raw-byte ceiling:

- Opportunity Chat: `OPPORTUNITY_CHAT_MAX_BODY_BYTES` (default `65536`)
- Fireflies: `FIREFLIES_MAX_BODY_BYTES` (default `1048576`)

The overrides must be positive integers or `fireflies-server` refuses to start.
One byte over the applicable limit returns HTTP 413 `payload_too_large`;
malformed JSON returns HTTP 400 `invalid_json`. Rejected requests do not reach
CRM reads, Fireflies processing, or paid AI calls. Fireflies HMAC verification
runs over the exact raw bytes before JSON parsing.

Focused worker tests run as part of `npm test`. Injectable boundaries for
service authentication, HTTP body reads, Fireflies signatures, upstream fetch,
Graph cursor storage, and current time live in `workers/lib/worker-foundation.mjs`.

Microsoft Graph and Fireflies read operations use real aborting network
deadlines plus at most three attempts for timeouts, network resets, HTTP
408/429, and selected 5xx replies. Retry delays use capped exponential backoff
with jitter. OpenRouter calls use a hard deadline but no automatic retry, which
avoids sending a paid AI request twice. Defaults and optional overrides are
documented in `docs/configuration.md`; invalid values fail startup. Exhausted
attempts report only the operation, attempt count, and safe HTTP status, never
tokens, request bodies, or upstream response bodies.

The checked-in systemd one-shot units also have command-level time ceilings.
Repository changes do not affect installed units until an explicitly authorized
installation and `systemctl daemon-reload`.

Opportunity Chat verifies the bearer token with Supabase Auth, then resolves
`api.current_user_profile()` in that user's JWT context. Only an active profile
with unrevoked CRM access or the administrator role may reach service-role CRM
reads. Missing or invalid tokens return 401; authenticated users without access
return 403. Denial logs contain only the status and Auth user ID, never JWTs,
questions, email content, or CRM records.

The worker records unknown email domains with
`crm.record_ingested_domain(...)`. It must not insert random email domains into
`core.customer`; only human promotion through `crm.promote_ingested_domain(...)`
creates potential customers.
