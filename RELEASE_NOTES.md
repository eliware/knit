# Release Notes

## 13.0.0 — 2026-10-17

### Added

- Knit returns HTTP 200 after it queues a valid signed webhook. Event work runs after the response.
- Knit sends commit, repository, ref, event, and request ID values through SSH environment requests.
- Knit cross-posts version-tagged release notices in Discord announcement channels.
- Knit adds focused source modules and matching test suites for webhook, channel, publisher, and notice rules.

### Changed

- Knit names each Discord channel with the repository name after the owner name. It encodes punctuation and rejects names above 100 characters.
- Knit checks for an announcement channel for each event. It uses a match or creates the repository name without a suffix.
- Knit sets channel access from repository visibility and sets the topic from package text before it posts.
- Knit keeps the current channel topic when an event has no package data. It rejects keyword text above Discord's topic limit.
- Knit runs tag deployments only when a configured tag pattern matches. It gives unmatched tags a neutral ignored result.
- Knit requires at least one deployment in each configured action.
- Knit tracks pending and completed webhook requests. It ignores duplicate request IDs and does not retry failed requests.
- Knit updates the GHCR image tag to `v13.0.0` and verifies its attestation with the GitHub token.
- Knit updates package metadata to version `13.0.0` and aligns its description with the repository map.
- Knit updates dependencies to available releases and uses the canonical GHCR publication workflow.

### Fixed

- Knit reports correct and failed webhook results in Discord status updates.
- Knit preserves active status when webhook requests overlap or an end request has an incorrect ID.
- Knit keeps Discord embeds in the field and total text limits.
- Knit encodes GitHub actor names in profile links and file paths in GitHub Contents requests.
- Knit escapes repository text in Discord notices and escapes the version on the landing page.

## 12.0.0 — 2026-10-14

### Added

- Added user guides for application use, configuration, and troubleshooting.
- Added requirement specs, directive specs, and a runnable example.
- Added a localized Discord `/help` command and interaction handlers.
- Added CI and GHCR workflows for validation and image publication.
- Added image attestations and digest checks to the GHCR release workflow.

### Changed

- Updated Knit to the Eliware v12 conventions and release checks.
- Organized source code and tests into focused modules and suites.
- Set the package entry point to `bin/knit.mjs` and kept launcher logic small.
- Kept release publication on GHCR. Removed npm package publication.
- Updated the deployment example to pull `main` from `/eliware/knit`.
- Clarified that Knit checks SSH files when it opens an SSH connection.
- Removed the tracked `repos/.gitkeep` placeholder. Local checkouts do not require it.

### Fixed

- Kept webhook event names during target routing.
- Improved target checks, webhook signatures, request limits, and request handling.
- Returned a direct client error for malformed JSON webhook requests.
- Encoded repository path components in GitHub Contents requests.
- Escaped repository-controlled Markdown and mentions in Discord event embeds.
- Rejected stale status updates during later or anonymous work.

### Security

- Escaped repository-controlled text before Knit adds it to Discord embeds.
- Encoded repository path components before Knit requests GitHub Contents files.
