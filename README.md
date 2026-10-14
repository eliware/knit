# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/knit [![License](https://img.shields.io/github/license/eliware/knit)](https://github.com/eliware/knit/blob/main/LICENSE) [![CI](https://github.com/eliware/knit/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/knit/actions/workflows/ci.yaml)

GitHub webhook handler and SSH deployment automation service with Discord notifications, delivery-aware presence, and metadata-aware validation workflows.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Configuration](#configuration)
- [Operations](#operations)
- [Commands](#commands)
- [Events](#events)
- [Intents and permissions](#intents-and-permissions)
- [Support](#support)
- [Links](#links)
- [License](#license)

## Features

Knit validates GitHub signatures and target profiles. It reads each repository workflow at the event commit. It runs approved commands on verified SSH targets. It sends event and deployment results to Discord.

## Requirements

Use Node.js 26 or later. Provide a GitHub webhook secret and a valid target inventory. Provide a Discord bot and guild settings to enable Discord notices.

## Setup

Install dependencies with `npm ci`. Set the runtime variables in [the configuration guide](docs/knit-config-guide.md). Create the target inventory. Add a version 1 workflow to each repository. Read the [docs index](docs/README.md) for the end-user guides.

## Usage

Run `npm start` to start Knit. Set the GitHub webhook URL to `https://<host>/`. Set the webhook content type to `application/json`. Use `GET /health` to check service status. Read the [docs index](docs/README.md) for end-user guides. Read [release notes](RELEASE_NOTES.md) for version changes. Read [specifications](specs/README.md) for repository requirements.

## Development

Use Node.js 26 and npm. Run `npm ci` to install locked packages. Keep runtime secrets and target credentials outside Git.

## Testing

Run `npm test` for full validation. Run `npm run lint` for lint checks. Run `npm run audit` for dependency checks. Run `npm run format` to format files. Run `npm run format:check` to check file format.

## Troubleshooting

Check webhook delivery status, signature settings, target access, and SSH host keys. Follow [the troubleshooting guide](docs/troubleshooting.md) for fault steps.

## Security

Knit checks the webhook signature before event processing. It reads workflows at the signed commit. It checks target access and SSH host keys before remote commands.

## Configuration

Set `GITHUB_WEBHOOK_SECRET` as a runtime secret. Set `GITHUB_READ_TOKEN` for private GitHub repositories or higher API limits. Set `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` together to enable Discord. Set `KNIT_CONFIG_PATH` or `KNIT_TARGETS_PATH` to select the target inventory. Set `PORT` to change the default port, `3456`. Read [the configuration guide](docs/knit-config-guide.md) for fields and examples.

## Operations

Knit validates targets before it opens external connections. It gets `.knit/deploy.yaml` and `package.json` at the webhook commit. It runs deployment commands in order. A nonzero command result marks the deployment as failed. GHCR publication builds an image. GitOps controls image deployment. Read [usage](docs/usage.md) for start, health, and shutdown steps.

## Commands

The `/help` command gives a short service summary. Knit requests only the Discord `Guilds` intent.

## Events

Knit handles repository `push` events. It sends special Discord notices for `release`, `workflow_run`, `pull_request`, `issues`, `deployment`, and `deployment_status` events. It sends a general notice for other repository events. It ignores events without a repository name.

## Intents and permissions

Enable the `Guilds` intent. Grant the bot `View Channels`, `Manage Channels`, `Manage Roles`, and `Send Messages` permissions. Knit does not request message, member, presence, reaction, typing, or scheduled event intents.

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

## Links

- [Home Page](https://eliware.org)
- [GitHub Org](https://github.com/eliware)
- [GitHub Repo](https://github.com/eliware/knit)
- [Bug Reports](https://github.com/eliware/knit/issues)
- [Discord](https://discord.gg/M6aTR9eTwN)

## License

[MIT © Eliware](LICENSE)
