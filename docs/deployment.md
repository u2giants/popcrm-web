# Deployment — popcrm-web

This is the current production deployment process for the POP CRM frontend.

## Current State

`popcrm-web` serves:

- `https://crm.designflow.app`
- `https://crm-dev.designflow.app`

It is currently deployed as a locally built Docker image attached to the existing Coolify proxy network. It is not yet a Coolify-managed app with CI.

## Build And Deploy

```bash
npm run build
docker build -t popcrm-web:latest .

docker rm -f popcrm-web 2>/dev/null
docker run -d --name popcrm-web --restart unless-stopped --network coolify \
  --label "traefik.enable=true" \
  --label 'traefik.http.routers.popcrm-web-http.rule=Host(`crm-dev.designflow.app`) || Host(`crm.designflow.app`)' \
  --label traefik.http.routers.popcrm-web-http.entrypoints=http \
  --label traefik.http.routers.popcrm-web-http.middlewares=redirect-to-https@docker \
  --label 'traefik.http.routers.popcrm-web-https.rule=Host(`crm-dev.designflow.app`) || Host(`crm.designflow.app`)' \
  --label traefik.http.routers.popcrm-web-https.entrypoints=https \
  --label traefik.http.routers.popcrm-web-https.tls=true \
  --label traefik.http.routers.popcrm-web-https.tls.certresolver=letsencrypt \
  --label traefik.http.services.popcrm-web.loadbalancer.server.port=80 \
  popcrm-web:latest
```

## Verify

```bash
curl -fsS https://crm.designflow.app | rg -o '<title>[^<]+'
curl -fsS https://crm-fireflies.designflow.app/health
docker ps --filter 'name=popcrm-web' --format '{{.Names}} {{.Status}}'
```

Expected title:

```txt
<title>POP CRM
```

## Runtime Config

This is a static SPA. `VITE_*` values are baked at build time.

`VITE_DIRECTUS_URL` defaults to `https://data.designflow.app`.

## Rollback

Rebuild from a known-good commit and re-run the deployment command, or run a previously tagged local image if available.

## Future Work

Move this to a proper Coolify app or GitHub Actions-driven deploy. Until then, raw Docker on the host is the accepted production process for this frontend.
