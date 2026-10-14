# AGENTS.md

## Project

Knit runs signed GitHub webhooks and SSH deployment commands.

## Scope and boundaries

Keep service and workflow changes in this repository. Use GitOps to deploy released container images.

## Layout

Keep implementation in `src/`. Keep launchers in `bin/`. Keep tests in `tests/`. Keep test support in `test-fixtures/`.

## Development

Use Node.js 26 and native ESM. Keep runtime secrets outside Git.

## Validation

Run `npm test`, `npm run lint`, `npm run audit`, `npm run format`, and `npm run format:check`.

## Security

Use strict SSH host verification. Do not print secrets.

## Changes

Keep package metadata, lockfile data, docs, and workflows in sync. Do not deploy during local validation.

## Application

Validate targets before connections. Fetch workflows at the webhook commit. Keep launchers thin. Keep user documentation in `docs/`.

## Discord

Use only the `Guilds` intent. Document commands, events, intents, and permissions in `README.md`.

## GHCR publication

Image: ghcr.io/eliware/knit

Pull command: docker pull ghcr.io/eliware/knit:v12.0.0

Supported tags: vMAJOR.MINOR.PATCH

Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.
