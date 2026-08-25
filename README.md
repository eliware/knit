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

The main target configuration contains one Discord `guildId`, not project channel IDs. Knit finds a text channel named after the repository, creating it on demand. New channels are public for public GitHub repositories and hide `@everyone` for private repositories.

Kubernetes uses a content-hashed ConfigMap for repository configuration. Updating a config through GitOps changes the ConfigMap name and the Deployment reference, causing Kubernetes to restart Knit with the new configuration. Knit does not monitor mounted files for changes while running.

Targets execute commands over SSH with strict host verification through `@eliware/ssh-client`. GitOps target profiles own connection details and may restrict repository access and working-directory roots. CA-signed host certificates are trusted through an `@cert-authority` record in `known_hosts` or a mounted `hostCa` public-key file.

New configurations must use YAML and SSH targets. Local Compose requires only `KNIT_CONFIG_PATH`; systemd requires an equivalent mounted/provisioned config path.

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

Development now takes place on the Windows workstation under `C:\Users\russe\src\knit`; the former OVH `dev` VM is a legacy deployment target. Kubernetes releases use immutable container images and Argo CD GitOps. New Knit code is delivered by releasing an image, not by runtime self-updating.
