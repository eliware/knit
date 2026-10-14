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

Knit accepts signed GitHub webhooks. It runs repository deployment commands over verified SSH targets. It sends event and deployment updates to Discord.

## Requirements

Use Node.js 26 or later. Configure GitHub webhook access, a Discord bot, and trusted SSH targets before deployment.

## Setup

Run `npm ci` to install the locked dependencies. Set the environment values in the Configuration section. Mount the target inventory and SSH assets.

## Usage

Run `npm start` to start Knit. Send signed GitHub events to `POST /`. Open `GET /health` to read service status and version.

Read [the configuration guide](docs/knit-config-guide.md), [usage notes](docs/usage.md), and [release notes](RELEASE_NOTES.md). Read [the docs index](docs/README.md) and [the specification index](specs/README.md) for more information.

## Development

Run `npm ci` to install dependencies. Run `npm start` to start the service. Keep local secrets outside Git.

## Testing

Run `npm test` for the full repository checks. Run `npm run lint` for lint checks. Run `npm run format:check` to check formatting.

## Troubleshooting

Read [the troubleshooting guide](docs/troubleshooting.md). Confirm webhook delivery, signature settings, target access, and SSH host keys.

## Security

Knit checks webhook signatures before it accepts events. It reads deployment workflows at the signed commit. It checks SSH host identity before it runs commands.

## Configuration

Set `GITHUB_WEBHOOK_SECRET`, `GITHUB_READ_TOKEN`, `DISCORD_TOKEN`, and `DISCORD_CLIENT_ID` through runtime secrets. Set `KNIT_CONFIG_PATH` for the mounted configuration directory. Set `KNIT_TARGETS_PATH` only when the target inventory uses a separate path. Set `PORT` to change the HTTP port. Set `LOG_LEVEL` to change log output.

Target profiles are YAML files. The default target inventory is `repos/targets.yaml`. Repository workflows are stored in `.knit/deploy.yaml`. Each workflow uses a target name, absolute working directory, and command list.

## Operations

Knit validates target profiles before it opens the Discord connection. It fetches repository workflows at the webhook commit SHA. It reports command results in the matching Discord channel.

Kubernetes releases use immutable container images and Argo CD GitOps. Image publication does not deploy Knit. The deployment workflow runs validation on the configured target.

## Commands

The `/help` command returns a short description of Knit.

## Events

Knit sends Discord updates for GitHub releases, workflow runs, pull requests, issues, deployments, and deployment status changes. It sends a general update for other repository events.

## Intents and permissions

Knit requests the Guilds intent. The bot needs permission to view the configured guild, create announcement channels, edit channel topics, and send messages.

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
