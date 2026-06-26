# Deployment — popcrm-web

POP CRM is deployed through the compliant CI/CD path: **GitHub Actions builds
and publishes the image; Coolify pulls and runs it.** GitHub Actions never SSHes
into or mutates the production server.

Shared server/infrastructure standards for the designflow.app VPS live in
[`u2giants/albert-standards/infrastructure`](https://github.com/u2giants/albert-standards/tree/main/infrastructure).
When deployment topology, domains, Coolify ownership, server dependencies,
break-glass actions, or infrastructure incident runbooks change here, update that
repository as part of the same documentation pass.

## Normal release path

```text
push to main
  ↓
GitHub Actions (.github/workflows/deploy.yml)
  verify        – npm ci, npm run lint, npm run build (tsc -b && vite build)
  build-and-push – Docker build (build-args: COMMIT_HASH/DATE,
                   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
                   VITE_LOGODEV_TOKEN),
                   push to GHCR (tags: latest, main, sha-<sha>)
  deploy         – POST Coolify deploy API, then wait for crm.designflow.app
                   to serve the exact commit that was just built
  ↓
Coolify (https://coolify.designflow.app)
  pulls ghcr.io/u2giants/popcrm-web:latest and updates the container
  ↓
crm.designflow.app  (runtime host only)
```

Every release is traceable from: GitHub Actions run history → the `sha-<commit>`
tag in GHCR → Coolify's deployment history → the repo commit. The running build's
commit + timestamp are also shown in the app header (top bar).

To release: merge/commit to `main`. That's it. Documentation / AI-context-only
changes (`docs/**`, `**/*.md`, `.claudeignore`, `.cursorignore`, `.copilotignore`)
are path-ignored and do not trigger a build.

## Topology (the facts an owner needs to audit / recreate)

| Item | Value |
|---|---|
| Deployment platform | Coolify `https://coolify.designflow.app` |
| Project | POP Creations CRM (`yp84tp0tmmshhcebgsd4j463`) |
| Environment | production |
| Coolify application | `popcrm-web` — uuid `a1vb55by4benmh25nd4ga8pt` |
| Server (runtime host) | localhost (`onwp0kd7w1w74w9yeotnoihp`) |
| Registry image | `ghcr.io/u2giants/popcrm-web` (public package) |
| Image tag pattern | `latest`, `main`, `sha-<commit-sha>` |
| Production domains | `crm.designflow.app`, `crm-dev.designflow.app` |
| Deploy trigger | GitHub Actions → `POST {COOLIFY_BASE_URL}/api/v1/deploy?uuid=<app>` |
| Runtime config owner | Coolify (domains, ports, restart policy, health) |
| Build-time config | `VITE_*` (baked into the static bundle — see note) |
| Rollback | redeploy a previous `sha-<sha>` image via Coolify |

## Host workers

POP CRM also owns host-side maintenance workers for the shared Supabase backend:

| Runtime | Owner/path | Schedule |
|---|---|---|
| Outlook ingest | `systemd/popcrm-outlook-ingest.*` -> `workers/crm-worker-supabase.mjs outlook-ingest` | every 15 minutes |
| Email reroute | `systemd/popcrm-reroute.*` -> `workers/crm-worker-supabase.mjs reroute` | every 6 hours |
| Contact sync | `systemd/popcrm-contact-sync.*` -> `workers/crm-worker-supabase.mjs contact-sync` | daily |
| Opportunity summaries | `systemd/popcrm-summarize.*` -> `workers/crm-worker-supabase.mjs summarize` | every 6 hours |
| Ignore-rule sweep | `systemd/popcrm-apply-ignore-rules.*` -> `workers/crm-worker-supabase.mjs apply-ignore-rules` | every 6 hours |
| Fireflies webhook/chat | Docker container `popcrm-fireflies` -> `workers/crm-worker-supabase.mjs fireflies-server` | always on |

Secrets stay outside git in mode-600 `/home/ai/.crm-worker.env` and in
1Password item `POP CRM Supabase Worker Env - hetz /home/ai/.crm-worker.env`.
The active workers must not reference `/worksp/directus`.

### GitHub Actions secrets (CI/CD only)

- `COOLIFY_BASE_URL` — `https://coolify.designflow.app`
- `COOLIFY_API_TOKEN` — Coolify API token used to trigger the deploy
- `COOLIFY_SERVER_UUID` — the Coolify **application** uuid (`a1vb55by4benmh25nd4ga8pt`)
- `VITE_SUPABASE_URL` — Supabase project URL baked into the static bundle
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key baked into the static
  bundle. This is client configuration, not a service-role key.
- `LOGODEV_TOKEN` — logo.dev **publishable** token, passed as the
  `VITE_LOGODEV_TOKEN` Docker build-arg (`deploy.yml` → Dockerfile) so customer
  logos bake into the bundle. **Optional**: if unset the build still succeeds and
  customers render initials avatars. Client-safe (publishable), not a real secret.

The image is pushed to GHCR with the workflow's built-in `GITHUB_TOKEN`
(`packages: write`); no registry PAT is stored. Because `popcrm-web` is a public
repo, its GHCR package is public, so Coolify pulls it anonymously.

### Runtime config note (static SPA)

This is a static site, so its few `VITE_*` values are **build-time**, baked into
the bundle at `npm run build`. `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are required by `src/lib/supabase.ts`; changing them
requires rebuilding and redeploying. This is the one documented exception to
"runtime config lives in Coolify" (CI/CD rules §19) — a static bundle has no
server-side runtime env. No service-role keys or backend secrets are baked in.

## Rollback

Preferred (CI/CD rules §6.3): in Coolify, redeploy the `popcrm-web` application
pinned to a previous immutable tag, e.g. `ghcr.io/u2giants/popcrm-web:sha-<old>`.
Do **not** roll back by hand-editing containers or running `docker run` on the host.

## Verify a release

```bash
curl -fsS https://crm.designflow.app | rg -o '<title>[^<]+'      # <title>POP CRM
curl -fsS https://crm.designflow.app/assets/<current-index>.js | rg '<short-sha>'
curl -fsS https://crm-fireflies.designflow.app/health            # Fireflies webhook
# The header in the app shows the deployed commit + NYC time.
```

The GitHub Actions deploy job performs the same commit-aware check automatically:
it discovers the currently served `/assets/index-*.js` bundle and fails unless
that bundle contains the workflow's `GITHUB_SHA::7`. A plain HTTP 200 from the
old container is not enough for the deploy job to pass.

## Troubleshoot 502 after deploy

On 2026-06-22, a deploy succeeded and the app container was healthy, but
`crm.designflow.app` returned 502 because `coolify-proxy`/Traefik lost access to
the Docker socket and could not discover the new upstream container.

Use this order before rebuilding or rolling back:

```bash
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' | rg 'popcrm|a1vb55by4benmh25nd4ga8pt'
docker logs --tail=100 <app-container-name>
docker exec <app-container-name> wget -qO- http://127.0.0.1/contacts | head
docker logs --tail=200 coolify-proxy | rg 'Docker daemon|providerName=docker|error'
```

If the app responds internally but proxy logs show
`Cannot connect to the Docker daemon at unix:///var/run/docker.sock`, restart the
proxy to restore Traefik route discovery:

```bash
docker restart coolify-proxy
```

## Break-glass only (NOT the normal path)

Manual Docker on the host is **emergency-only** (CI/CD rules §10). If the CI/CD
path is unavailable and production must be restored, you may run the published
image directly:

```bash
docker run -d --name popcrm-web-emergency --network coolify \
  ghcr.io/u2giants/popcrm-web:sha-<known-good>
```

Any emergency action must be followed immediately by restoring the normal
Coolify-managed deployment so the server does not become a hidden source of truth.
