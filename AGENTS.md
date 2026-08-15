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
- `discordChannelId` selects the Discord channel for notifications; SSH assets are mounted under `/run/secrets/eliware/ssh/`.
- Organization-level events use `eliware/knit` as the notification fallback.
- `eliware/knit` may SSH-deploy `/opt/knit` after pushes; it does not self-restart. New Knit code requires an image release and Argo CD rollout.
- SSH uses strict host verification. Never weaken verification or commit secrets.

## Configuration

Use `.env.example` as the template. Important variables: `PORT`, `GITHUB_WEBHOOK_SECRET`, `LOG_LEVEL`, and `KNIT_CONFIG_PATH`.

## Development rules

- Read `README.md` before behavior changes; keep edits scoped and ESM style.
- Update tests for application behavior changes.
- For documentation-only work, run focused grep/Markdown consistency checks; do not run the full test suite unless requested.
- Never deploy, sync, tag, or push unless explicitly requested.

## Notifications

Repository configs contain channel IDs, not notification credentials. Only the Discord bot token and SSH assets belong in runtime/Kubernetes Secrets.

## Container and restart workflow

- Docker Compose is the active runtime on the development host; systemd is disabled there. Do not run both on port 3456.
- `docker compose up -d --build` builds and starts the service; verify `docker compose ps` reports healthy and query `/health`.
- The container image contains the application and starts `node knit.mjs` directly.
- Kubernetes releases use immutable images and Argo CD GitOps.
- Do not print or commit `.env`, decrypted configs, private keys, webhook secrets, or generated runtime files.

## Documentation checks

For documentation-only changes, verify links/paths against the repository and inspect `git diff --check`. Do not modify `RELEASE_NOTES.md` unless specifically requested.
