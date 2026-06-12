# build
FROM node:20-alpine AS build
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
# logo.dev publishable token (client-safe) for domain-derived account logos.
# Empty is fine — accounts fall back to initials avatars when unset.
ARG VITE_LOGODEV_TOKEN=""
ENV VITE_LOGODEV_TOKEN=$VITE_LOGODEV_TOKEN
RUN npm run build
# serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
