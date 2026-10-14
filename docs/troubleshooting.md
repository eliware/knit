# Troubleshooting

Use the symptom and checks below to find the fault. Read service logs after each check. Do not share secrets or private keys in logs or support requests.

## Knit exits during startup

1. Check that Node.js 26 or later runs on the host.
2. Check that the target inventory path exists and contains valid YAML.
3. Check that the inventory has a `guildId` and at least one target.
4. Check each target for `host`, `user`, `identity`, `knownHosts`, and `hostCa`.
5. Check that each SSH file exists and that Knit can read it.
6. Check that both Discord settings exist, or leave both unset.
7. Run `npm test` after you correct the settings.

## GitHub returns an error for a webhook

1. Check the GitHub delivery page for the response code and response body.
2. Confirm that the webhook uses `application/json`.
3. Confirm that GitHub and Knit use the same `GITHUB_WEBHOOK_SECRET`.
4. Confirm that the request includes a valid `X-Hub-Signature-256` header.
5. Confirm that the endpoint accepts `POST /` from GitHub.
6. Confirm that `GET /health` returns status `ok`.

Knit rejects unsigned requests. It does not run commands for a rejected request.

## Knit ignores a delivery

Confirm that the event has `repository.full_name`. Confirm that the repository has a target that allows its name. Confirm that the event type has a configured handler. Events without repository names do not run repository workflows.

## Knit cannot read a repository workflow

Confirm that `.knit/deploy.yaml` exists at the webhook commit. Confirm that the webhook commit SHA is valid. For a private repository, confirm that `GITHUB_READ_TOKEN` can read repository contents. Confirm that the token has no write access unless another service needs it.

## A deployment fails

1. Read the command output in the Discord notice or service log.
2. Confirm that the workflow names an existing target.
3. Confirm that `cwd` is absolute and inside `allowedCwdRoot`.
4. Confirm that `allowedRepositories` includes the repository when that list exists.
5. Confirm that the target accepts the configured SSH user and key.
6. Confirm that `knownHosts` and `hostCa` trust the target host.
7. Run each command by hand with the same user and working directory.
8. Return a nonzero exit code when a command detects a fault.

Knit runs commands in order. The first nonzero result fails the deployment. By default, Knit stops before later deployments. Keep commands safe to repeat because GitHub may retry a delivery.

## Discord notices do not arrive

Confirm that both Discord variables are set. Confirm that the bot joined the guild in `guildId`. Grant view, create announcement channel, edit topic, and send message permissions. Confirm that the bot can access the target channel. Knit requires the `Guilds` intent.

## GitHub API limit or access fault

Set `GITHUB_READ_TOKEN` when GitHub needs authentication. Grant read access to repository contents. Restart Knit after you change the runtime environment.

## Still blocked

Record the request time, GitHub delivery ID, repository name, event type, and sanitized error text. Remove tokens, signatures, private URLs, and key data. Open an [issue](https://github.com/eliware/knit/issues) with the safe details.
