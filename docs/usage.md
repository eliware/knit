# Usage

Knit accepts signed GitHub webhook requests. It checks target settings before it opens GitHub, Discord, or SSH connections. It reads each repository workflow at the commit in the webhook. It runs commands on the named SSH target. It sends results to Discord when Discord settings exist.

## Requirements

Use Node.js 26 or later. Provide a GitHub webhook secret. Provide a valid target inventory. Give Knit network access to GitHub and each target. Allow Discord access when you enable Discord notices. Set up a bot and guild for those notices.

## Start Knit from a checkout

1. Install Node.js 26 or later.
2. Clone this repository.
3. Run `npm ci` in the repository directory.
4. Create the target inventory. Read the [configuration guide](knit-config-guide.md).
5. Set `GITHUB_WEBHOOK_SECRET` in the runtime environment.
6. Set both Discord variables or leave both unset.
7. Run `npm start`.

Knit listens on port `3456` by default. Set `PORT` to use another port. Keep the process manager or container active so Knit can receive webhook requests.

## Start Knit from a container

Use the GHCR image after release publication:

```sh
docker pull ghcr.io/eliware/knit:v12.0.0
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
  ghcr.io/eliware/knit:v12.0.0
```

Replace each source path with a host file or directory. Put `targets.yaml` in `/path/to/config`. The SSH paths in the target inventory must use the container paths shown above. Supply secrets through your container secret store. Do not put secret values in shell history. The image uses Node.js 26 and listens on port `3456` by default.

## Check service status

Open `GET /health`. A healthy response has `status` set to `ok` and the running version. Open `GET /` for the service page. Send GitHub events to `POST /`.

Set the GitHub webhook content type to `application/json`. Set the same secret in GitHub and `GITHUB_WEBHOOK_SECRET`. Subscribe to `push`, `release`, `workflow_run`, `pull_request`, `issues`, `deployment`, and `deployment_status` events as needed. Knit rejects requests with a missing or invalid signature.

## Event behavior

Knit uses repository `push` events to run deployment commands. It reads `.knit/deploy.yaml` and `package.json` at the event commit. It sends specialized Discord notices for release, workflow, pull request, issue, and deployment events. It sends a general notice for other repository events. It ignores events without a repository name.

Knit passes these values to every remote command:

| Name               | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| `KNIT_COMMIT_SHA`  | Valid 40-character webhook commit SHA, or empty text. |
| `KNIT_REPOSITORY`  | Full repository name, or empty text.                  |
| `KNIT_REF`         | Git ref, or empty text.                               |
| `KNIT_EVENT`       | GitHub event name, or empty text.                     |
| `KNIT_DELIVERY_ID` | GitHub delivery ID, or empty text.                    |

Knit sends these values through SSH environment requests. Configure the SSH server to accept them with `AcceptEnv KNIT_*`. Commands can read them as environment variables. Knit sends the original command without an export prefix.

## Discord command and activity

Use `/help` to read the short service summary. Knit needs the `Guilds` intent. It creates or reuses an announcement channel for each repository. It sets the channel topic from the repository description and keywords. Grant `View Channels`, `Manage Channels`, `Manage Roles`, and `Send Messages` permissions.

The bot shows the Knit version when idle. It shows a repository name during work and a result after work. Knit limits activity updates to Discord's rate limit. Do not use activity changes as deployment status records.

## Stop Knit

Send `SIGINT` or `SIGTERM` to the process. Knit closes the HTTP server and Discord client. Use your process manager or container platform to send the signal.

## More help

Read the [configuration guide](knit-config-guide.md) to set targets and repository workflows. Read [troubleshooting](troubleshooting.md) to resolve setup and delivery faults. Read the [release notes](../RELEASE_NOTES.md) for user-visible changes.
