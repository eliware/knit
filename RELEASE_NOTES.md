# Release Notes

## 12.0.1 — 2026-10-14

### Added

- Knit returns HTTP 200 after it queues a valid signed webhook. Event processing runs after the response.
- Knit sends commit, repository, ref, event, and delivery values through SSH environment requests.
- Knit cross-posts version-tagged release notices in Discord announcement channels.
- Knit adds focused source modules and matching test suites for webhook, channel, publisher, and notice rules.

### Changed

- Knit uses the repository name after the owner slash for its Discord announcement channel. It encodes punctuation and rejects names over 100 characters.
- Knit checks for an existing announcement channel on each event. It reuses a match or creates the repository name without a suffix.
- Knit sets channel access from repository visibility and sets the topic from package description and keywords before it posts.
- Knit keeps the current channel topic when an event has no package metadata. It rejects keyword text over Discord's topic limit.
- Knit runs tag deployments only when a configured tag pattern matches. It treats unmatched tags as ignored events with a neutral result.
- Knit requires at least one deployment in each configured action.
- Knit tracks pending and completed webhook deliveries. It ignores duplicate delivery IDs and does not retry failed deliveries.
- Knit updates the GHCR image tag to `v12.0.1` and verifies its attestation with the GitHub token.
- Knit updates `dotenv` to `18.0.8` and the package version to `12.0.1`.

### Fixed

- Knit keeps success and failure results consistent across webhook processing and Discord activity updates.
- Knit preserves active activity state when deliveries overlap or a completion has the wrong delivery ID.
- Knit keeps Discord embeds within field and total text limits, including when fields exceed the total limit.
- Knit encodes GitHub actor names in profile links and GitHub file paths in Contents requests.
- Knit escapes repository text in Discord notices and escapes the version in the service page.

## 12.0.0 — 2026-10-14

### Added

- Added user guides for service use, configuration, and troubleshooting.
- Added requirement specs, directive specs, and a runnable example.
- Added a localized Discord `/help` command and interaction handlers.
- Added CI and GHCR workflows for validation and image publication.
- Added image attestations and digest checks to the GHCR release workflow.

### Changed

- Updated Knit to the Eliware v12 conventions and release checks.
- Organized source code and tests into focused modules and suites.
- Set the package entry point to `bin/knit.mjs` and kept the launcher thin.
- Kept release publication on GHCR. Removed npm package publication.
- Updated the deployment example to pull `main` from `/eliware/knit`.
- Clarified that Knit checks SSH files when it opens an SSH connection.
- Removed the tracked `repos/.gitkeep` placeholder. Local checkouts no longer need it.

### Fixed

- Kept webhook event names during target routing.
- Improved target validation, webhook signature checks, rate limiting, and delivery retries.
- Returned a clear client error for malformed JSON webhook requests.
- Encoded repository path components in GitHub Contents requests.
- Escaped repository-controlled Markdown and mentions in Discord event embeds.
- Rejected stale presence updates during later or anonymous work.

### Security

- Escaped repository-controlled text before Knit adds it to Discord embeds.
- Encoded repository path components before Knit requests GitHub Contents files.
