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
ARG TURNSTILE_SITE_KEY
RUN yarn build:public \
  && yarn build:workspace \
  && node -e "const fs=require('node:fs');const p='dist/public/browser/index.html';const s=fs.readFileSync(p,'utf8');const marker=/<meta name=\"turnstile-site-key\" content(?:=\"\")?>/;const key=process.env.TURNSTILE_SITE_KEY;if(!key)throw new Error('TURNSTILE_SITE_KEY is required');if(!marker.test(s))throw new Error('Turnstile site-key marker was not found');fs.writeFileSync(p,s.replace(marker,'<meta name=\"turnstile-site-key\" content=\"'+key+'\">'));"

FROM caddy:2.11.4-alpine AS runtime
COPY deploy/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist/public/browser /srv/public
COPY --from=build /src/dist/workspace/browser /srv/workspace
USER 1000:1000
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
