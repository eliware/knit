# @eliware/knit

GitHub webhook handler and SSH deployment automation service.

## Runtime

- Node.js >=26; ESM.
- `POST /` receives signed GitHub webhooks.
- `GET /` serves the Knit project landing page.
- `GET /health` returns service status and version.
- Repository configuration is YAML mounted at `KNIT_CONFIG_PATH` (default `./repos`).
- YAML files use `<owner>__<repo>.yaml` naming in Kubernetes ConfigMaps.
- Configuration is loaded once per process; GitOps content-hashed ConfigMaps trigger a pod rollout for changes.

## Configuration

Modern configuration uses SSH targets:

```yaml
repository: owner/repo
discordChannelId: "123456789012345678"
git:
  url: git@github.com:owner/repo.git
  ref: main
targets:
  - name: dev
    host: dev.example
    user: root
    workingDirectory: /opt/repo
    commands:
      - git pull --ff-only
      - npm install
      - npm test
execution:
  mode: sequential
  stopOnError: true
```

`discordChannelId` is the Discord channel snowflake where Knit posts embeds. Repository configuration is intentionally plaintext YAML and contains no credentials. The bot token and SSH assets remain runtime secrets; SSH assets are mounted at `/run/secrets/eliware/ssh/`.

Kubernetes uses a content-hashed ConfigMap for repository configuration. Updating a config through GitOps changes the ConfigMap name and the Deployment reference, causing Kubernetes to restart Knit with the new configuration. Knit does not monitor mounted files for changes while running.

Targets execute commands over SSH with strict host verification. If `commands` is present, Knit executes that list exactly, in order, and does not add implicit Git commands. This lets each repository define its own deployment contract. For backward compatibility, targets without `commands` use `pre`, configured Git synchronization, and `post`. `identity` and `knownHosts` may be `host-installed` or paths relative to the configured path. Modern targets are SSH-only.

New configurations must use YAML and SSH targets. Local Compose requires only `KNIT_CONFIG_PATH`; systemd requires an equivalent mounted/provisioned config path.

## Knit self-deployment and organization fallback

`eliware/knit` is configured as the fallback target for organization-level GitHub events. Its legacy push deployment may run `git pull`, `npm install`, and `npm test` on the production development host, then send the result to Discord. Successful source updates do not restart the process; release a new immutable image and let Argo CD roll it out for Knit code changes.

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

Development now takes place on the Windows workstation under `C:\Users\russe\src\knit`; the former OVH `dev` VM is a legacy deployment target. Kubernetes releases use immutable container images and Argo CD GitOps. New Knit code is delivered by releasing an image, not by runtime self-updating.
