# AGENTS.md (/opt/knit)

Knit (`@eliware/knit`) is a GitHub webhook handler and deployment automation service. It validates signatures, routes repository and organization events, deploys locally or over SSH, and sends Discord notifications. It runs on `dev`, publicly routed at `https://knit.eliware.org`.

## Layout

- `knit.mjs` — service entry
- `wizard.mjs` — interactive encrypted-config wizard
- `src/` — application modules
- `tests/` — Jest suite
- `repos/` — runtime config-repository checkout/work area
- `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` — container runtime
- `knit.service`, `knit-config-sync.sh` — systemd runtime/config sync
- `assets/` — static assets

## Operational behavior

- `POST /` receives signed GitHub webhooks; `GET /health` returns status and version.
- Modern configs deploy sequentially to SSH targets (`host`, `user`, `workingDirectory`, optional `identity`/`knownHosts`); legacy `pwd` configs remain local-compatible.
- The encrypted `knit-configs` repository is cloned/reset into `KNIT_CONFIG_REPO_PATH` (normally `/opt/knit/repos`). Config files are `owner/repo.json.age` and decrypt with age.
- Systemd runs `knit-config-sync.sh` as `ExecStartPre`; Docker entrypoint performs the same sync before Node startup.
- Config-repository SSH always requires a deploy key and `known_hosts`, with strict host checking. Never weaken verification or commit secrets.
- Automatic successful updates may push `Pushback YYYY-MM-DD HH:mm:ss` commits.

## Configuration

Use `.env.example` as the template. Important variables: `PORT`, `GITHUB_WEBHOOK_SECRET`, `LOG_LEVEL`, `KNIT_CONFIG_REPO_URL`, `KNIT_CONFIG_REPO_REF`, `KNIT_CONFIG_REPO_PATH`, `KNIT_CONFIG_DEPLOY_KEY_FILE`, `KNIT_CONFIG_KNOWN_HOSTS_FILE`, age recipient/identity variables, `KNIT_CONFIG_PLAINTEXT_PATH`, and `KNIT_DEFAULT_TARGET_HOST`. See README for defaults and the complete table.

Run `./wizard.mjs` interactively. It requires age configuration, writes a mode-0600 plaintext draft outside the checkout, and writes encrypted config under the runtime checkout.

## Development rules

- Read `README.md` before behavior changes; keep edits scoped and ESM style.
- Update tests for application behavior changes.
- For documentation-only work, run focused grep/Markdown consistency checks; do not run the full test suite unless requested.
- Never deploy, sync, commit, tag, or push unless explicitly requested.

## Notifications

`notify` accepts a URL string or object `{url, maxRetries, timeoutMs, wait, threadId, threadName}`. `@eliware/discord-webhook` owns validation, limits, retries, timeouts, and HTTP errors. Clone provided embeds before truncation and preserve deployment-log tails. Test notification behavior changes for success, oversized content, options, immutability, and contextual failures.
