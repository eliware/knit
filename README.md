# @eliware/knit

GitHub webhook handler and SSH deployment automation service.

## Runtime

- Node.js >=26; ESM.
- `POST /` receives signed GitHub webhooks.
- `GET /` serves the Knit project landing page.
- `GET /health` returns service status and version.
- Trusted target profiles are YAML mounted at `KNIT_CONFIG_PATH` (default `./repos`).
- Repository deployment workflows live in each repository at `.knit/deploy.yaml`.
- Knit fetches and validates that file at the webhook commit SHA; there is no central repository configuration or legacy fallback.

## Configuration

For a complete agent-oriented tutorial, see [the Knit configuration guide](docs/knit-config-guide.md).

Repository workflow configuration uses target-specific command sets:

```yaml
version: 1
on:
  push:
    deployments:
      - target: dev
        cwd: /opt/repo
        commands:
          - git pull --ff-only
          - npm install
          - npm test
  tags:
    "v*":
      deployments:
        - target: dev
          cwd: /opt/repo
          commands:
            - npm run release
```

Repository workflows are intentionally plaintext YAML and contain no credentials. The GitHub read token, Discord bot token, and SSH assets remain runtime secrets. Pushes and matching `v*` tags select separate actions; there is no fallback from a tag to the push action.

The main target configuration contains one Discord `guildId`, not project channel IDs. Knit finds an Announcement channel named after the repository, creating it on demand. New channels are public but read-only for public GitHub repositories and hide `@everyone` for private repositories. Repository descriptions and keywords from `package.json` are synchronized into the channel topic, and `v*` tag announcements are cross-posted.

Kubernetes uses a content-hashed ConfigMap for repository configuration. Updating a config through GitOps changes the ConfigMap name and the Deployment reference, causing Kubernetes to restart Knit with the new configuration. Knit does not monitor mounted files for changes while running.

Targets execute commands over SSH with strict host verification through `@eliware/ssh-client`. GitOps target profiles own connection details and may restrict repository access and working-directory roots. CA-signed host certificates are trusted through an `@cert-authority` record in `known_hosts` or a mounted `hostCa` public-key file.

Each SSH command receives the triggering webhook metadata as environment variables:

| Variable | Value |
|---|---|
| `KNIT_COMMIT_SHA` | Exact webhook `after` SHA, or empty when absent/malformed |
| `KNIT_REPOSITORY` | Full repository name, such as `eliware/gitops-k8s` |
| `KNIT_REF` | Webhook ref, such as `refs/heads/main` |
| `KNIT_EVENT` | GitHub event name |
| `KNIT_DELIVERY_ID` | Webhook delivery correlation ID |

Workflows may set `timeoutMs` on a deployment, from 1 through 300000 milliseconds, to bound each remote command. Values are passed through SSH environment requests; Knit does not interpolate arbitrary environment variables into command strings or place secrets in these metadata variables. Commands should enforce their own cleanup and must not print secrets. Output is truncated for Discord limits; secret redaction remains the responsibility of the command and runtime configuration.

New configurations must use YAML and SSH targets. Local Compose requires the target inventory, Discord credentials, and read-only mounts for the SSH identity, strict `known_hosts`, and host CA; systemd requires equivalent mounted/provisioned configuration and secrets.

## Operations

Knit validates target profiles before opening the Discord connection. Repository workflows are evaluated per signed event and pinned to the webhook commit. The encrypted runtime Secret is owned and recovered through the GitOps secret-management process; never copy workstation private keys, decrypted secrets, or GitHub tokens into this repository.

## Knit self-deployment and organization events

Organization-level events are ignored unless they include a repository. Repository pushes fetch and execute only that repository's committed `.knit/deploy.yaml`. Knit code changes are delivered as immutable container releases through GitOps; source push handling does not restart the running service.

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | Listen port; default `3456` |
| `GITHUB_WEBHOOK_SECRET` | GitHub signature secret |
| `LOG_LEVEL` | Logger level |
| `KNIT_CONFIG_PATH` | Mounted configuration directory |
| `KNIT_TARGETS_PATH` | Optional explicit path to the trusted target inventory; otherwise `KNIT_CONFIG_PATH/targets.yaml` |
| `NODE_ENV` | Runtime mode; use `test` only for test execution |
| `GITHUB_READ_TOKEN` | GitHub Contents API token for private repository workflow files |
| `DISCORD_TOKEN` | Discord bot token, supplied from a runtime Secret |
| `DISCORD_CLIENT_ID` | Discord application/client ID |

## Development

```sh
npm install
npm test
npm run lint
npm start
```

`npm test` uses `@eliware/test` for the baseline Jest coverage and Oxlint
checks. It requires 100×4 coverage and zero lint warnings; project-specific
integration, smoke, regression, or end-to-end checks remain separate.

Development now takes place on the Windows workstation under `C:\Users\russe\src\knit`; the former OVH `dev` VM is a legacy deployment target. Kubernetes releases use immutable container images and Argo CD GitOps. New Knit code is delivered by releasing an image, not by runtime self-updating. The notifier implementation is organized under `src/notifier/`, and webhook command-environment construction is isolated in `src/webhookEnvironment.mjs`.
