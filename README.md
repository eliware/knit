# @eliware/knit

GitHub webhook handler and SSH deployment automation service.

## Runtime

- Node.js >=26; ESM.
- `POST /` receives signed GitHub webhooks.
- `GET /health` returns service status and version.
- Repository configuration is YAML/JSON mounted at `KNIT_CONFIG_PATH` (default `./repos`).
- YAML files use `<owner>__<repo>.yaml` naming in Kubernetes ConfigMaps.

## Configuration

Modern configuration uses SSH targets:

```yaml
repository: owner/repo
notifyKey: owner__repo
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

`notifyKey` resolves to `/run/secrets/discord-webhooks/<notifyKey>`. Webhook URLs belong in Kubernetes Secrets, encrypted in GitOps with SOPS/age. They must not appear in configuration files.

Targets execute commands over SSH with strict host verification. `identity` and `knownHosts` may be `host-installed` or paths relative to the configured path. Modern targets are SSH-only.

Legacy local JSON configurations remain supported only for migration. New configurations must use YAML and SSH targets.

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | Listen port; default `3456` |
| `GITHUB_WEBHOOK_SECRET` | GitHub signature secret |
| `LOG_LEVEL` | Logger level |
| `KNIT_CONFIG_PATH` | Mounted configuration directory |
| `KNIT_DISCORD_WEBHOOK_SECRET_PATH` | Mounted Discord webhook Secret directory |

## Development

```sh
npm install
npm test
npm run lint
npm start
```

Kubernetes releases use immutable container images and Argo CD GitOps. Knit does not clone or update its own source or configuration repositories.
