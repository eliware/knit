# @eliware/knit

GitHub webhook handler and SSH deployment automation service.

## Runtime

- Node.js >=26; ESM.
- `POST /` receives signed GitHub webhooks.
- `GET /health` returns service status and version.
- Repository configuration is YAML mounted at `KNIT_CONFIG_PATH` (default `./repos`).
- YAML files use `<owner>__<repo>.yaml` naming in Kubernetes ConfigMaps.

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
    pre: []
    post: []
execution:
  mode: sequential
  stopOnError: true
```

`discordChannelId` is the Discord channel snowflake where Knit posts embeds. The bot token belongs in runtime/Kubernetes Secrets, encrypted in GitOps with SOPS/age; it must not appear in configuration files. SSH assets are mounted at `/run/secrets/eliware/ssh/`.

Targets execute commands over SSH with strict host verification. `identity` and `knownHosts` may be `host-installed` or paths relative to the configured path. Modern targets are SSH-only.

New configurations must use YAML and SSH targets. Local Compose requires `KNIT_CONFIG_PATH` and `KNIT_DISCORD_WEBHOOK_SECRET_HOST_PATH` directories; systemd requires equivalent mounted/provisioned paths.

## Knit self-deployment and organization fallback

`eliware/knit` is configured as the fallback target for organization-level GitHub events. Its push deployment runs `git pull`, `npm install`, and `npm test` on `dev.purinton.us:/opt/knit`, then sends the result to Discord. Successful deployments do not restart the process; release a new image and let Argo CD roll it out for Knit code changes.

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

Kubernetes releases use immutable container images and Argo CD GitOps. Knit can receive its own repository webhook and SSH-deploy `/opt/knit`; new Knit code is delivered by releasing an image, not by runtime self-updating.
