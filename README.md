# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/knit [![License](https://img.shields.io/github/license/eliware/knit)](https://github.com/eliware/knit/blob/main/LICENSE) [![CI](https://github.com/eliware/knit/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/knit/actions/workflows/ci.yaml)

GitHub webhook handler and SSH deployment automation tool with Discord notifications, message status, and metadata-aware validation workflows.

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

Knit validates GitHub signatures and trusted targets. It runs repository commands through SSH and sends event results to Discord.

## Requirements

Use Node.js 26 or later and npm 12 or later. Provide a GitHub webhook secret and a target inventory. Configure Discord to enable notices.

## Setup

Run `npm ci` to install packages. Set runtime values and create the target inventory as shown in the [configuration guide](docs/knit-config-guide.md). Read the [docs index](docs/README.md) for user guides.

## Usage

Run `npm start` to start Knit. Configure the GitHub webhook as described in the [usage guide](docs/usage.md). Read [release notes](RELEASE_NOTES.md) for version changes.

## Development

Read [AGENTS.md](AGENTS.md) and the [specifications index](specs/README.md) before you change files. Keep documentation and records in this repository.

## Testing

Run `npm test` for full validation. It runs the repository checks through `eliware-test`.

## Troubleshooting

Read the [troubleshooting guide](docs/troubleshooting.md) to check startup, webhook, target, SSH, and Discord faults.

## Security

Keep secrets, credentials, private data, and runtime state out of Git. Knit verifies webhook signatures and SSH host keys before it runs commands.

## Configuration

Set `GITHUB_WEBHOOK_SECRET` at runtime. Set `GITHUB_READ_TOKEN` to read private repository contents. Set both `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` to enable Discord notices.

Set `KNIT_CONFIG_PATH` or `KNIT_TARGETS_PATH` to select the target inventory. Set `PORT` to change the default port, `3456`.

Read the [configuration guide](docs/knit-config-guide.md) for all settings and examples.

## Operations

Knit validates targets before it connects. For a branch push, it reads `.knit/deploy.yaml` at the webhook commit and runs the configured commands. It returns HTTP 200 after it verifies and queues a valid request.

The GHCR image runs Knit. The publish workflow runs on version tags and does not set a target platform. GHCR package settings define image visibility and pull access. The publish job uses `GITHUB_TOKEN` with `packages: write`. This permission does not set pull access.

GitOps deploys the published image by immutable version tag and recorded SHA-256 digest. Image publication does not deploy Knit.

Read the [usage guide](docs/usage.md) for startup, webhook behavior, health checks, and shutdown.

## Commands

The `/help` command replies with a localized summary of Knit. Knit handles signed GitHub events and deployment notices.

## Events

The `clientReady` event logs that the Discord client started. The `interactionCreate` event routes chat input commands and ignores other interaction types.

For GitHub push events, Knit runs configured branch deployments and sends a result notice. Matching tag pushes send a notice without running commands. Knit also sends specialized notices for release, workflow, pull request, issue, and deployment events when GitHub sends them.

## Intents and permissions

Knit uses only the `Guilds` intent. Grant the bot the `Administrator` permission so it can access all channels. Do not add the bot to channel allowlists.

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
