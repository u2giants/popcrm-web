# build
# Current Node LTS line (issue #72): 26 "Lithium", active LTS as of 2026-10.
FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Commit identity is passed by CI (the .git dir is not in the build context).
# vite.config.ts reads these to stamp the build into the app header.
ARG COMMIT_HASH=""
ARG COMMIT_DATE=""
ENV COMMIT_HASH=$COMMIT_HASH
ENV COMMIT_DATE=$COMMIT_DATE
# logo.dev publishable token (client-safe) for domain-derived customer logos.
# Empty is fine — customers fall back to initials avatars when unset.
ARG VITE_LOGODEV_TOKEN=""
ENV VITE_LOGODEV_TOKEN=$VITE_LOGODEV_TOKEN
ARG VITE_SUPABASE_URL=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build
# serve
# Pinned to the current stable nginx patch (issue #72): the previous
# `nginx:alpine` tag floated. Stays the root-user stock image on port 80 on
# purpose: the nginx-unprivileged switch needs the Coolify app's port mapping
# (80 -> 8080) changed in the same rollout, and the available scoped Coolify
# write token cannot safely change the app's port mapping, so the LOCKED
# fallback in issue #72 keeps root nginx pinned.
FROM nginx:1.30.7-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Security headers snippet included by every location in nginx.conf (issue #70).
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Known version path the deploy check reads after Coolify deploys
# (scripts/verify-live-version.sh compares git_sha with the merged commit).
ARG VCS_REF=unknown
ARG COMMIT_HASH=""
ARG COMMIT_DATE=""
RUN printf '{"git_sha":"%s","commit":"%s","date":"%s"}\n' \
    "$VCS_REF" "$COMMIT_HASH" "$COMMIT_DATE" > /usr/share/nginx/html/version.json
EXPOSE 80
