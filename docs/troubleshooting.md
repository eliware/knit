# Troubleshooting

Use the symptom and checks in each section to find the fault. Read the application logs after each check.
Do not share secrets or private keys in logs or support requests.

## Knit exits during startup

1. Check that Node.js 26 or later runs on the host.
2. Check that the target inventory path exists and contains valid YAML.
3. Check that the inventory has a `guildId` and at least one target.
4. Check each target for `host`, `user`, `identity`, `knownHosts`, and `hostCa`.
5. Check that each SSH file exists and that Knit can read it.
6. Check that both Discord settings exist, or keep both unset.
7. Run `npm test` after you correct the settings.

## GitHub reports a webhook error

1. Check the GitHub request page for the response code and response body.
2. Confirm that the webhook uses `application/json`.
3. Confirm that GitHub and Knit use the same `GITHUB_WEBHOOK_SECRET`.
4. Confirm that the request includes a valid `X-Hub-Signature-256` header.
5. Confirm that the endpoint accepts `POST /` from GitHub.
6. Confirm that `GET /health` returns status `ok`.
7. Confirm that the GitHub webhook subscribes to the `push` event.

Knit rejects unsigned requests with HTTP 400. It does not queue a rejected request. Knit returns HTTP 200 after it verifies and queues a valid request. It does not wait for processing to complete.

## Knit ignores a webhook request

Confirm that the event has `repository.full_name`. Confirm that the repository has an allowed target. Confirm that the event type has a configured handler. Events without repository names do not run repository workflows.

The current GitHub webhook setup uses push events only. Knit ignores a tag push unless its tag matches a `tags` entry in `.knit/deploy.yaml`.

Knit uses the repository name after the owner slash for its channel name. Use unique repository names in the organization.

## Knit cannot read a repository workflow

Confirm that `.knit/deploy.yaml` exists at the webhook commit. Confirm that the webhook commit SHA is valid.
For a private repository, confirm that `GITHUB_READ_TOKEN` can read repository contents. Confirm that the token has no write access unless a separate application requires it.

## A deployment fails

1. Read the command output in the Discord notice or Knit log.
2. Confirm that the workflow names an existing target.
3. Confirm that `cwd` is absolute and inside `allowedCwdRoot`.
4. Confirm that `allowedRepositories` includes the repository when that list exists.
5. Confirm that the target accepts the configured SSH user and key.
6. Confirm that `knownHosts` and `hostCa` trust the target host.
7. Run each command by hand with the same user and working directory.
8. Return a nonzero exit code when a command detects a fault.

Knit runs commands in order. The first nonzero result fails the deployment. By default, Knit stops before later deployments. Knit does not retry a failed webhook request.

## A webhook processes but Discord has no notice

1. Confirm that both Discord settings are set.
2. Confirm that the bot joined the guild in `guildId`.
3. Confirm that the bot has the `Administrator` permission.
4. Confirm that the event has a repository name and a resolved target.
5. Confirm that the encoded repository name is no more than 100 characters.

The bot can access all channels because it has the `Administrator` permission. Do not add it to channel allowlists. Knit creates or reuses a channel with the repository name after the owner slash.

## GitHub API limit or access fault

Set `GITHUB_READ_TOKEN` when GitHub requires authentication. Grant read access to repository contents. Start Knit again after you change the runtime environment.

## If the fault continues

Record the request time, GitHub webhook ID, repository name, event type, processing stage, and safe error text.
Remove tokens, signatures, private URLs, and key data. Open an [issue](https://github.com/eliware/knit/issues) with safe details.
