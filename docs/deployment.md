# Deployment — popcrm-web

POP CRM is deployed through the compliant CI/CD path: **GitHub Actions builds
and publishes the image; Coolify pulls and runs it.** GitHub Actions never SSHes
into or mutates the production server.

## Normal release path

```text
push to main
  ↓
GitHub Actions (.github/workflows/deploy.yml)
  verify        – npm ci, npm run lint, npm run build (tsc -b && vite build)
  build-and-push – Docker build, push to GHCR (tags: latest, main, sha-<sha>)
  deploy         – POST Coolify deploy API, then wait for crm.designflow.app
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

### GitHub Actions secrets (CI/CD only)

- `COOLIFY_BASE_URL` — `https://coolify.designflow.app`
- `COOLIFY_API_TOKEN` — Coolify API token used to trigger the deploy
- `COOLIFY_SERVER_UUID` — the Coolify **application** uuid (`a1vb55by4benmh25nd4ga8pt`)

The image is pushed to GHCR with the workflow's built-in `GITHUB_TOKEN`
(`packages: write`); no registry PAT is stored. Because `popcrm-web` is a public
repo, its GHCR package is public, so Coolify pulls it anonymously.

### Runtime config note (static SPA)

This is a static site, so its few `VITE_*` values are **build-time**, baked into
the bundle at `npm run build`. `VITE_DIRECTUS_URL` defaults to
`https://data.designflow.app`; override it only by rebuilding. This is the one
documented exception to "runtime config lives in Coolify" (CI/CD rules §19) — a
static bundle has no server-side runtime env. No secrets are baked in.

## Rollback

Preferred (CI/CD rules §6.3): in Coolify, redeploy the `popcrm-web` application
pinned to a previous immutable tag, e.g. `ghcr.io/u2giants/popcrm-web:sha-<old>`.
Do **not** roll back by hand-editing containers or running `docker run` on the host.

## Verify a release

```bash
curl -fsS https://crm.designflow.app | rg -o '<title>[^<]+'      # <title>POP CRM
curl -fsS https://crm-fireflies.designflow.app/health            # Fireflies webhook
# The header in the app shows the deployed commit + NYC time.
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
