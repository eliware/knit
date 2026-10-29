# Knit usage

Knit accepts signed GitHub webhook requests. It reads trusted target settings at startup. It reads each repository workflow at the commit in a push event. It runs approved commands through SSH and sends results to Discord when Discord is enabled.

## Requirements

- Use Node.js 26 or later.
- Provide a GitHub webhook secret.
- Provide a valid target inventory.
- Allow outbound network access to GitHub and each SSH target.
- Configure Discord to receive Discord notices.
- Configure an SSH server to accept the Knit environment variables in this guide.

## Start Knit from a checkout

1. Install Node.js 26 or later.
2. Clone this repository.
3. Run `npm ci` in the repository directory.
4. Create the target inventory. Read the [configuration guide](knit-config-guide.md).
5. Set `GITHUB_WEBHOOK_SECRET` in the runtime environment.
6. Set both Discord variables or keep both unset.
7. Run `npm start`.

Knit listens on TCP port `3456` by default. Set `PORT` to select a different port. Keep the process active so it can accept webhook requests.

## Start Knit from a container

Use the GHCR image after release publication:

```sh
docker pull ghcr.io/eliware/knit:v15.0.1
docker run --rm -p 3456:3456 \
  --env GITHUB_WEBHOOK_SECRET \
  --env GITHUB_READ_TOKEN \
  --env DISCORD_TOKEN \
  --env DISCORD_CLIENT_ID \
  --env KNIT_CONFIG_PATH=/config \
  --mount type=bind,src=/path/to/config,dst=/config,readonly \
  --mount type=bind,src=/path/to/ssh/id_rsa,dst=/run/secrets/eliware/ssh/id_rsa,readonly \
  --mount type=bind,src=/path/to/ssh/known_hosts,dst=/run/secrets/eliware/ssh/known_hosts,readonly \
  --mount type=bind,src=/path/to/ssh/eliware_host_ca_ed25519.pub,dst=/run/secrets/eliware/ssh/eliware_host_ca_ed25519.pub,readonly \
  ghcr.io/eliware/knit:v15.0.1
```

Replace each source path with a host file or directory. Put `targets.yaml` in `/path/to/config`. Use the container paths in that file. Set secrets in your container secret store. Do not put secret values in shell history.

The image uses Node.js 26 and listens on TCP port `3456` by default. The image runs Knit. It does not deploy Knit. Use GitOps to deploy a published image by its version tag and recorded digest.

## Configure the GitHub webhook

1. Open the repository webhook settings in GitHub.
2. Set the payload URL to `https://HOST/` with your public host name.
3. Select `application/json` as the content type.
4. Set the same secret as `GITHUB_WEBHOOK_SECRET`.
5. Subscribe to the `push` event only.
6. Save the webhook and send a test push.

Knit also has handlers for other GitHub event types. The current installation uses push events only. Subscribe to other event types only when you enable their notices.

## Check Knit status

Open `GET /health`. A healthy response contains `status` set to `ok` and the running version. Open `GET /` to view the application page. GitHub sends events to `POST /`.

Knit returns HTTP 200 after it verifies and queues a valid request. It does not wait for event processing to complete. Knit rejects a missing or invalid signature with HTTP 400. It rejects malformed JSON with HTTP 400.
If the 1,000-task pending queue is full, Knit returns HTTP 503 immediately and does not queue the request.

## Event behavior

For a branch push, Knit reads `.knit/deploy.yaml` and `package.json` at the webhook commit. It runs the configured deployments in order. A nonzero command result fails the deployment. Knit stops after the first failed deployment by default.

For a tag push, Knit sends a notice when the tag matches a configured `tags` entry. Knit does not run commands for a tag push. An unmatched tag does not select a workflow action.

Knit sends specialized Discord notices for release, workflow, pull request, issue, and deployment events when GitHub sends those event types. It sends a general notice for other repository events. Knit ignores events without a repository name or a resolved target.

Knit does not retry a failed webhook request. Knit ignores a repeated webhook ID after it queues that request. A processing failure appears in the application logs and, when configured, in Discord.

## SSH environment values

Knit sends these values through SSH environment requests for each remote command:

| Name               | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| `KNIT_COMMIT_SHA`  | The 40-character commit SHA, or empty text when unavailable. |
| `KNIT_REPOSITORY`  | The full repository name, or empty text when unavailable.    |
| `KNIT_REF`         | The Git ref, or empty text when unavailable.                 |
| `KNIT_EVENT`       | The GitHub event name, or empty text when unavailable.       |
| `KNIT_DELIVERY_ID` | The GitHub webhook ID, or empty text when unavailable.       |

Configure the SSH server to accept these values with `AcceptEnv KNIT_*`. Knit sends each command without an `export` prefix.

## Discord channels and status

Use `/help` to read the short application summary. Knit uses the `Guilds` intent.

Knit uses the repository name after the owner slash as the channel name. Knit encodes punctuation as `_xHEX_`. Knit does not add a hash suffix. Knit reuses a matching announcement channel. If no matching announcement channel exists, Knit creates one with that repository name. Knit sets channel permissions from repository visibility and sets the topic from package metadata before it posts.

The bot needs the `Administrator` permission. This permission lets the bot access all channels. Do not add the bot to channel allowlists.

The bot shows the Knit version when idle. It shows a repository name during push work and a result after push work. Other event types do not change the bot status.

## Stop Knit

Send `SIGINT` or `SIGTERM` to the process. Knit closes the HTTP server and Discord client. Use the process manager or container platform to send the signal.

## More help

Read the [configuration guide](knit-config-guide.md) to set targets and repository workflows. Read [troubleshooting](troubleshooting.md) to resolve setup and webhook faults. Read the [release notes](../RELEASE_NOTES.md) for user-visible changes.
