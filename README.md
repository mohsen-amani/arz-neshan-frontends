# Arz Neshan frontends

This Angular workspace contains the production public site, tenant workspace,
and private platform console.

The release workflow builds two immutable images:

- `web`: public and workspace builds, selected by hostname through Caddy.
- `platform`: the platform console, exposed only on its exact operator hostname.

Push this directory as `mohsen-amani/arz-neshan-frontends`. Configure
`REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, and `INFRA_DISPATCH_TOKEN` as Actions
secrets, and `TURNSTILE_SITE_KEY` as an Actions variable. A successful `main`
release publishes both images with `sha-<commit>` tags and promotes them together
in `arz-neshan-infra`.

Local verification:

```sh
corepack enable
yarn install --immutable
yarn test
yarn build
docker build --build-arg TURNSTILE_SITE_KEY=test-site-key -f deploy/web/Dockerfile .
docker build -f deploy/platform/Dockerfile .
```
