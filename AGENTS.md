# AGENTS.md

## Project

Knit accepts GitHub webhooks and runs approved SSH commands.

## Scope and boundaries

Keep application and workflow changes in this repository. Use GitOps to deploy released container images.

## Layout

Keep implementation in `src/`. Keep launchers in `bin/`. Keep tests in `tests/`. Keep test support in `test-fixtures/`.

## Development

Use Node.js 26 or later and npm 12 or later. Use native ESM. Keep runtime secrets outside Git.

## Validation

Run one test file with `npm test -- tests/path/to/example.test.mjs`.
Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
Run `npm run lint`, `npm run audit`, `npm run format`, and `npm run format:check` as separate checks.

## Security

Use strict SSH host verification. Do not print secrets.

## Changes

Keep package metadata, lockfile data, docs, and workflows in sync. Do not deploy during local validation.

## Application

- Document entry points, workflows, settings, startup, and shutdown in `README.md`.
- Validate targets before connections.
- Fetch workflows at the webhook commit.
- Keep launchers for startup tasks.
- Keep user documentation in `docs/`.
- Run focused tests first during development.
- Run one test file with `npm test -- tests/path/to/example.test.mjs`.
- Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
- Prevent repeated full-suite runs during development.
- Run the full `npm test` suite for final validation before a commit, milestone, or release.

## Discord

Use only the `Guilds` intent. Document commands, events, intents, and permissions in `README.md`.

## GHCR publication

Image: ghcr.io/eliware/knit

Pull command: docker pull ghcr.io/eliware/knit:v13.0.0

Supported tags: vMAJOR.MINOR.PATCH

Deployment boundary: Publication does not deploy. Use an immutable version tag and record its SHA-256 digest.

Document image purpose, access, and deployment use in `README.md`.
