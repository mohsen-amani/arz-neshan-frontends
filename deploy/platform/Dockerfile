# syntax=docker/dockerfile:1.7

FROM node:22.23.1-bookworm-slim AS dependencies
WORKDIR /src
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
  yarn install --immutable

FROM dependencies AS build
COPY angular.json tsconfig.json .postcssrc.json ./
COPY projects ./projects
RUN yarn build:platform

FROM caddy:2.11.4-alpine AS runtime
COPY deploy/platform/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist/platform/browser /srv
USER 1000:1000
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
