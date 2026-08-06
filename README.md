# @eliware/knit

GitHub webhook handler and deployment automation service. Knit validates GitHub signatures, routes events, deploys configured repositories locally or over SSH, and sends Discord notifications.

## Runtime

- Node.js >=26; ESM.
- HTTP port: `PORT` (default `3456`).
- `POST /` receives GitHub webhooks. `GET /health` returns `{ "status": "ok", "version": "..." }`.
- Public deployment endpoint: `https://knit.eliware.org/`.

## Configuration repository

Production configuration is kept in the encrypted `knit-configs` repository, normally cloned to `./repos` ( `/opt/knit/repos` under systemd/container defaults). Files are `owner/repo.json.age`; Knit decrypts them with age and validates them. Plain `.json` files are supported for controlled local use, with legacy `repos/<name>.json` fallback.

Required config-sync inputs:

- `KNIT_CONFIG_REPO_URL`, `KNIT_CONFIG_REPO_REF`
- SSH deploy key (`KNIT_CONFIG_DEPLOY_KEY_FILE`)
- SSH `known_hosts` (`KNIT_CONFIG_KNOWN_HOSTS_FILE`)

Sync uses strict host checking and `IdentitiesOnly`; missing key or known_hosts fails startup. Never disable host verification or commit secrets.

### Modern repository config

```json
{
  "repository": "owner/repo",
  "git": { "url": "git@github.com:owner/repo.git", "ref": "main" },
  "targets": [{
    "name": "dev",
    "host": "dev.purinton.us",
    "user": "root",
    "identity": "host-installed",
    "knownHosts": "host-installed",
    "workingDirectory": "/opt/repo",
    "pre": [], "post": []
  }],
  "execution": { "mode": "sequential", "stopOnError": true },
  "notify": "https://discord.com/api/webhooks/..."
}
```

Targets execute pre-commands, fetch/reset the configured Git ref, then post-commands over SSH. `identity` and `knownHosts` may be `host-installed` or paths (relative paths resolve inside the config repository). Targets are sequential; `stopOnError` controls continuation. Legacy local configs with `pwd`, `pre`, `post`, `user`, `group`, and `notify` remain supported.

## Secrets and deployment files

Use age for config encryption. Set `KNIT_CONFIG_RECIPIENT` (or `KNIT_AGE_RECIPIENT`) when encrypting and `KNIT_AGE_IDENTITY_FILE` (or `KNIT_AGE_KEY_FILE`) for decryption. The identity must be available to the service; do not store plaintext configs, private keys, webhook URLs, or tokens in Git.

Docker installs git, OpenSSH, age, and CA certificates. `docker-entrypoint.sh` requires the config deploy key and known_hosts, clones or hard-resets the config repo, then starts Knit. `docker-compose.yml` mounts these as secrets and restarts the service unless stopped. `Dockerfile` defaults to port 3456 and `/opt/knit/repos`.

Systemd runs `knit-config-sync.sh` as `ExecStartPre`, then starts `knit.mjs` with `/opt/knit/.env`. The sync script fetches/reset the configured ref or reclones it, using strict SSH verification.

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | Listen port; default `3456` |
| `GITHUB_WEBHOOK_SECRET` | Required HMAC secret |
| `LOG_LEVEL` | Logger level |
| `KNIT_CONFIG_REPO_URL` | Config Git URL |
| `KNIT_CONFIG_REPO_REF` | Config Git ref; default `main` |
| `KNIT_CONFIG_REPO_PATH` | Config checkout; default `./repos` |
| `KNIT_CONFIG_DEPLOY_KEY_FILE` | Config-repo SSH key |
| `KNIT_CONFIG_KNOWN_HOSTS_FILE` | Config-repo known_hosts |
| `KNIT_AGE_IDENTITY_FILE` / `KNIT_AGE_KEY_FILE` | age identity for `.age` configs |
| `KNIT_CONFIG_RECIPIENT` / `KNIT_AGE_RECIPIENT` | age encryption recipient |
| `KNIT_CONFIG_PLAINTEXT_PATH` | Wizard plaintext output; default `/root/.config/knit-configs/plaintext` |
| `KNIT_DEFAULT_TARGET_HOST` | Wizard host default |
| `KNIT_AGE_BINARY` | age executable; default `age` |

## Wizard

Run `./wizard.mjs` (or `node wizard.mjs`) interactively. It collects repository, SSH target, working directory, pre/post commands, npm install/test choices, user, and notification URL. It writes a mode-0600 plaintext draft outside the checkout and an encrypted `owner/repo.json.age` under `KNIT_CONFIG_REPO_PATH`; encryption configuration is mandatory. Commit/push the encrypted file to the private config repository, not the plaintext draft.

## Notifications

`notify` accepts a webhook URL string or an object:

```json
{ "url": "https://discord.com/api/webhooks/...", "maxRetries": 3, "timeoutMs": 30000, "wait": false, "threadId": "123", "threadName": "deployments" }
```

Options are passed to `@eliware/discord-webhook`. Embeds are validated against package limits, cloned before truncation, and preserve deployment-log tails. Delivery failures are logged with event/repository context and rethrown.

## Development and testing

```bash
npm install
npm start
npm test
npm run lint
```

Use `npm test` for Jest tests and `npm run test:gaps` for coverage-gap reporting. Do not run deployment or config sync casually: webhook processing can execute commands and push automatic `Pushback YYYY-MM-DD HH:mm:ss` commits after successful updates.

License: MIT.

## Runtime restart behavior

Set `"restart": "graceful"` in a modern repository configuration to request a restart only after all configured targets complete successfully. Knit drains its FIFO webhook queue before exiting. Under Docker Compose, `restart: unless-stopped` starts the process again; under systemd, `Restart=always` provides the equivalent supervision. Run only one runtime manager at a time.

For container deployments, `docker compose up -d --build` exposes Knit at `http://127.0.0.1:3456`. The entrypoint refreshes both the application checkout and encrypted configuration checkout, decrypts runtime SSH support files, and starts the current application checkout. Docker secrets must provide the config deploy key, known-hosts file, and age identity.

A local target uses `"type": "local"` and executes in its `workingDirectory`; SSH targets use strict host verification. For containerized SSH deployments, reference an encrypted config-repository asset such as `eliware/ssh/id_rsa` rather than `host-installed`.
