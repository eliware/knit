# Configuration guide

Knit reads runtime settings from environment variables. It reads trusted SSH targets from `targets.yaml`. It reads each push workflow from `.knit/deploy.yaml` at the webhook commit. Do not put runtime secrets or private keys in a repository.

## Environment variables

| Name                    | Required  | Default                                          | Purpose                                                                                                   |
| ----------------------- | --------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `GITHUB_WEBHOOK_SECRET` | Yes       | None                                             | Checks the GitHub signature.                                                                              |
| `GITHUB_READ_TOKEN`     | No        | None                                             | Reads private repository files and raises the GitHub API limit. Grant read access to repository contents. |
| `DISCORD_TOKEN`         | As a pair | None                                             | Starts the Discord bot.                                                                                   |
| `DISCORD_CLIENT_ID`     | As a pair | None                                             | Identifies the Discord application.                                                                       |
| `KNIT_CONFIG_PATH`      | No        | `repos` under the current directory              | Selects the target configuration directory.                                                               |
| `KNIT_TARGETS_PATH`     | No        | `targets.yaml` under the configuration directory | Selects the target inventory file. This value overrides `KNIT_CONFIG_PATH`.                               |
| `PORT`                  | No        | `3456`                                           | Selects the HTTP listener endpoint.                                                                       |

Keep both Discord values unset to disable Discord notices. Set both values to enable Discord. Knit stops at startup if only one value exists.

The target inventory remains required when Discord is off. Set a read token when GitHub must read a private repository. Knit can read public repositories without a token, subject to the GitHub API limit.

Use this example with placeholder values. Replace each required value in your secret store.
Keep optional values unset when you do not use them.

```dotenv
GITHUB_WEBHOOK_SECRET=replace-with-a-random-secret
# Optional: GITHUB_READ_TOKEN=replace-with-a-read-only-token
# Optional: DISCORD_TOKEN=replace-with-a-bot-token
# Optional: DISCORD_CLIENT_ID=replace-with-the-application-id
# Optional: KNIT_CONFIG_PATH=./repos
# Optional: KNIT_TARGETS_PATH=./repos/targets.yaml
# Optional: PORT=3456
```

Do not commit filled values. Use the container or host secret store for production values.

## Target inventory

Create `repos/targets.yaml`, or set `KNIT_TARGETS_PATH` to a different file. Knit requires a `guildId` and at least one target.
Each target requires `host`, `user`, `identity`, `knownHosts`, and `hostCa` values. Use absolute paths for SSH files. `allowedCwdRoot` limits the working directory. `allowedRepositories` limits the repositories that can use the target.

```yaml
guildId: "000000000000000000"
targets:
  production:
    host: "host.example.invalid"
    user: "deploy"
    identity: "/run/secrets/eliware/ssh/id_rsa"
    knownHosts: "/run/secrets/eliware/ssh/known_hosts"
    hostCa: "/run/secrets/eliware/ssh/eliware_host_ca_ed25519.pub"
    allowedCwdRoot: "/opt/services"
    allowedRepositories:
      - "owner/repository"
```

Replace each example value. For Docker Compose, put the SSH files in `~/.ssh` with the names in `docker-compose.yml`.
For `docker run`, attach the files to the container paths in this example. Keep private keys outside Git.
Use a trusted host CA and known-hosts file. Configure the target to accept the user and key.

Set `allowedCwdRoot` to the smallest safe root.

Knit checks target fields before it opens network connections. A missing inventory, invalid YAML, missing guild ID, or incomplete target stops startup. Knit reads SSH files when it opens an SSH connection. Correct each path and start Knit again.

## Repository workflow

Commit `.knit/deploy.yaml` to each repository. Use version `1`. Set an absolute `cwd`. Keep it under `allowedCwdRoot` when the target sets that value. Name an existing target. Add one or more commands.

```yaml
version: 1
on:
  push:
    deployments:
      - target: production
        cwd: /opt/services/example
        timeoutMs: 300000
        commands:
          - git pull
          - npm ci
          - npm test
```

Knit runs deployments and commands in order. A nonzero command result fails that deployment. Knit stops after the first failed deployment by default. Set `stopOnError: false` to run later deployments after a failure.
Knit does not retry a failed webhook request. Knit ignores a repeated webhook ID after it queues that request.

Push logs show the repository, ref, GitHub webhook ID, stage, and elapsed time. Command logs show the command, exit code, and elapsed time.
Knit redacts detected credentials in command logs and Discord notices.
Knit does not include raw SSH error output in Discord notices.

Set `stopOnError: false` on the push action to continue to later deployments after a failure. The default value stops later deployments after the first failure.

Set `timeoutMs` to a value from `1` to `300000` milliseconds. The timeout applies to each remote command. Use a script with its own overall deadline for longer work.

Knit accepts `tags` entries with the keys `v` or `v*`. Both keys match tags in the `vMAJOR.MINOR.PATCH` format. A matching tag push sends a Discord notice. Knit does not run tag commands. Each tag entry must contain a valid `deployments` list because the workflow format requires one.

For example, this workflow runs commands for branch pushes and sends a notice for matching version tags:

```yaml
version: 1
on:
  push:
    deployments:
      - target: production
        cwd: /opt/services/example
        commands: [.knit/deploy.sh]
  tags:
    "v*":
      deployments:
        - target: production
          cwd: /opt/services/example
          commands: [.knit/deploy.sh]
```

The tag entry does not run its listed command. Add valid target names, working directories, and commands because Knit validates the workflow before it handles the tag.

## GitHub workflow access

Knit reads `.knit/deploy.yaml` at the webhook commit SHA. It also reads `package.json` at that commit when the file exists. Knit checks the GitHub Contents response and file digest.
Set `GITHUB_READ_TOKEN` when GitHub must read private repository contents. Grant read access to repository contents only.

## Discord setup

Create a Discord application and bot. Invite the bot to the guild named by `guildId`.
Copy the bot token and application ID into the runtime secret store. Set both `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`.

Grant the bot the `Administrator` permission. The bot can access all channels. Do not add the bot to channel allowlists.

Enable the `Guilds` intent only.

Knit uses the required `guildId` from the target inventory. It does not read message content or member lists.

Knit uses the lowercased repository name after the owner slash as the channel name. It keeps letters, numbers, and hyphens, and drops unsupported characters without replacement text. Repositories with the same normalized name share a channel. Knit reuses a matching announcement channel or creates one when no match exists. It sets permissions from repository visibility and sets the topic from package metadata before it posts. A normalized repository name longer than 100 characters cannot be used.

## Image and deployment boundary

The GHCR image runs Knit. The publication workflow builds and pushes a version tag after validation. The workflow does not set a target platform.

GHCR package settings control image access. Users require package access to pull the image.

The workflow compares the published image digest with the build output and records the digest in its summary.

GitOps deploys images by immutable version tag and recorded digest. Image publication does not deploy Knit.
