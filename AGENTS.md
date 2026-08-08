# AGENTS.md (/opt/knit)

Knit (`@eliware/knit`) is a GitHub webhook handler and SSH deployment automation service. It validates signatures, routes repository and organization events, deploys configured repositories over SSH, and sends Discord notifications. It runs on `dev`, publicly routed at `https://knit.eliware.org`.

## Layout

- `knit.mjs` — service entry
- `src/` — application modules
- `tests/` — Jest suite
- `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` — container runtime
- `knit.service` — optional systemd runtime
- `assets/` — static assets

## Operational behavior

- `POST /` receives signed GitHub webhooks; `GET /health` returns status and version.
- Repository configs are YAML files mounted at `KNIT_CONFIG_PATH`; Kubernetes uses `<owner>__<repo>.yaml` filenames.
- Modern configs deploy sequentially to SSH targets (`host`, `user`, `workingDirectory`, optional `identity`/`knownHosts`).
- `notifyKey` resolves a webhook URL from the mounted Secret path `KNIT_DISCORD_WEBHOOK_SECRET_PATH`.
- Knit does not clone/update its own source or configuration repositories.
- SSH uses strict host verification. Never weaken verification or commit secrets.

## Configuration

Use `.env.example` as the template. Important variables: `PORT`, `GITHUB_WEBHOOK_SECRET`, `LOG_LEVEL`, `KNIT_CONFIG_PATH`, and `KNIT_DISCORD_WEBHOOK_SECRET_PATH`.

## Development rules

- Read `README.md` before behavior changes; keep edits scoped and ESM style.
- Update tests for application behavior changes.
- For documentation-only work, run focused grep/Markdown consistency checks; do not run the full test suite unless requested.
- Never deploy, sync, tag, or push unless explicitly requested.

## Notifications

`notifyKey` selects a file containing the Discord webhook URL. Webhook values belong in runtime/Kubernetes Secrets and must never be logged or committed plaintext.

## Container and restart workflow

- Docker Compose is the active runtime on the development host; systemd is disabled there. Do not run both on port 3456.
- `docker compose up -d --build` builds and starts the service; verify `docker compose ps` reports healthy and query `/health`.
- The container image contains the application and starts `node knit.mjs` directly.
- Kubernetes releases use immutable images and Argo CD GitOps.
- Do not print or commit `.env`, decrypted configs, private keys, webhook secrets, or generated runtime files.

## Documentation checks

For documentation-only changes, verify links/paths against the repository and inspect `git diff --check`. Do not modify `RELEASE_NOTES.md` unless specifically requested.
