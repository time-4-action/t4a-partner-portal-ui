# Deployment

`.github/workflows/deploy.yml` (workflow `ci`) runs `check` → `deploy` → `verify`,
the same pipeline as `t4a-partner-portal-api` and `t4a-admin`.

**check** runs on every pull request and every push to `main`: `npm ci`,
`npm run lint`, `npm run build`. Runs on `main` are queued, never cancelled.

**deploy** runs only on `main` after a green check. It builds the image with the
commit SHA baked in as `APP_VERSION`, pushes
`ghcr.io/time-4-action/t4a-partner-portal-ui:<sha>` and `:latest` (Docker Hub is no
longer used), then SSHes to the VM and, in `DEPLOY_DIR` (default
`/data/stack/apps/time-4-action/export/ui`), pulls with the job's `GITHUB_TOKEN`,
`docker compose up -d` with `APP_IMAGE` set to the new SHA, waits up to 60 s for
`/healthz` on the published port and checks the container's `APP_VERSION`. On
failure it rolls back to the previous image and fails the run. **verify** requests
`https://export.time-4-action.com/healthz` (override with `PRODUCTION_URL`).

`/healthz` (`src/app/healthz/route.js`) is excluded from the Auth0 proxy and does
not call the export API, so an API outage never rolls back a UI deploy.

All config is runtime env from the server's `.env` beside the compose file; the
image contains none (`.env*` is in `.dockerignore`). The server compose file is
`deploy/docker-compose.yaml`; it and `.env` are edited by hand, the deploy only
swaps images. Roll back by re-running an older commit's workflow, or on the server:
`export APP_IMAGE=ghcr.io/time-4-action/t4a-partner-portal-ui:<sha> && docker compose up -d`.

## GitHub settings

Organization secrets, same values as t4a-admin: `PROD_DEPLOY_HOST`,
`PROD_DEPLOY_SSH_KEY`, `PROD_DEPLOY_FINGERPRINT`. Optional repository variables:
`DEPLOY_USER` (default `deploy`), `DEPLOY_DIR`, `PRODUCTION_URL`.

## Production on t4a (since 2026-11-06)

Production moved from t2 to t4a (Hetzner, `77.42.42.60`; time-4-action/t4a-infra,
`servers/t4a`). What points the deploy there is set on the `production` environment
only. Environment secrets win over the organization secrets of the same name, so the
other repos that share them are not affected:

| On the `production` environment | Value |
|---|---|
| secret `PROD_DEPLOY_HOST` | `77.42.42.60` |
| secret `PROD_DEPLOY_SSH_KEY` | the private key `github-actions@t4a-partner-portal-ui-t4a` (its public half is in `/home/deploy/.ssh/authorized_keys` on t4a) |
| secret `PROD_DEPLOY_FINGERPRINT` | t4a's **ECDSA** host key, `SHA256:2wkXWs0QETKFiXKXbxbJRASeNd9I6zigPKVQGBtwfTk` (the action's Go SSH client picks ECDSA; the Ed25519 fingerprint fails with "host key fingerprint mismatch") |
| variable `DEPLOY_DIR` | `/srv/export-ui` |

On t4a, `/srv/export-ui` (owned by `deploy`) holds `docker-compose.yaml`
(= `deploy/docker-compose.t4a.yml`: Traefik labels for `export.time-4-action.com`,
loopback port 3002 for the health check) and `.env` (copied from t2 unchanged; every
URL in it is public). DNS: a proxied CNAME `export` → `production.time-4-action.com`
in the `time-4-action.com` zone, which overrides the `*` wildcard that still points
at t2. First deploy through the pipeline: run 42220633431 (green).

The t2 container is stopped, not removed (`/data/stack/apps/time-4-action/export/ui`).
To go back: delete the DNS record and the four settings above, then
`docker compose start` there.
