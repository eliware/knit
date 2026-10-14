# AGENTS.md

## Project

This repository contains Knit, a GitHub webhook and SSH deployment service.

## Scope and boundaries

Keep service code and deployment workflow changes within this repository. Use GitOps to deploy released container images.

## Layout

Keep implementation modules under `src/`. Keep launchers under `bin/`. Keep tests under `tests/`. Keep test support under `test-fixtures/`.

## Development

Use Node.js 26 and native ESM. Keep each module focused on one purpose. Use the README and docs index for repository guidance.

## Validation

Use npm 12 or later. Run `npm test` for aggregate validation. Run `npm run lint` for lint checks. Run `npm run audit` for dependency checks. Run `npm run format` to format files. Run `npm run format:check` to check formatting.

## Security

Keep credentials, private keys, decrypted data, and runtime state out of Git. Use strict SSH host verification. Do not print secrets.

## Changes

Keep package metadata, lockfile data, docs, and workflows in sync. Do not publish or deploy from local validation.

## Application

Document supported events, routes, settings, startup, shutdown, and operations in README.md. Use YAML for target profiles and repository workflows. Supply secrets through the runtime environment. Validate targets before service startup. Deploy immutable container images through GitOps.

## Discord

Document webhook notifications, Discord events, intents, and permissions in README.md. Request only the Guilds intent.

## GHCR publication

Image: ghcr.io/eliware/knit

Pull command: docker pull ghcr.io/eliware/knit:v12.0.0

Supported tags: vMAJOR.MINOR.PATCH

Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.
