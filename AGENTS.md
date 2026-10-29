# AGENTS.md

## Project

See README.md for the repository purpose, owner, and scope.

## Scope and boundaries

Keep requirements in their authoritative specifications.

## Layout

Use README.md and specs/README.md to find maintained files.

## Development

Use Node.js 26 or later and native ESM for maintained JavaScript modules.

## Validation

Run `npm test` for aggregate validation.
Run `npm run lint` for lint checks.
Run `npm run audit` for dependency checks.
Run `npm run format` to format files.
Run `npm run format:check` to check formatting.

## Security

Keep credentials, secret values, private data, and runtime state out of Git.

## Changes

Update focused tests and user documentation when application behavior changes.

## Application

Run focused tests first during development.
Run one test file with `npm test -- tests/path/to/example.test.mjs`.
Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
Prevent repeated full-suite runs during development.
Run the full `npm test` suite for final validation before a commit, milestone, or release.

## Discord

Use only the `Guilds` intent. Document commands, events, intents, and permissions in README.md.

## GHCR publication

Image: ghcr.io/eliware/knit

Pull command: docker pull ghcr.io/eliware/knit:v15.0.1

Supported tags: vMAJOR.MINOR.PATCH

Deployment boundary: Publication does not deploy. Use an immutable version tag and record its SHA-256 digest.
