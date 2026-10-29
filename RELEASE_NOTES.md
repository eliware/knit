# Release Notes

## 15.0.1 — 2026-10-29

### Added

- Knit returns HTTP 200 after it queues a valid signed webhook. Event work starts after the response.
- Knit sends commit, repository, ref, event, and request ID values through SSH environment requests.
- Knit posts release notices in Discord announcement channels.
- Knit uses the repository name after the owner slash for its announcement channel. It encodes punctuation and does not add a hash.
- Knit checks the channel list for each event. It reuses a matching announcement channel or creates one with the repository name.
- Knit sets channel access from repository visibility and updates the topic before it posts.
- Knit adds focused source modules and matching test suites for webhook, channel, publisher, and notice rules.

### Changed

- Knit uses Eliware Test v15 and current package dependencies.
- Knit uses version 15.0.1 in package metadata, the lockfile, image examples, and repository instructions.
- Knit updates CI and GHCR publication workflows to the canonical workflow files.
- The GHCR workflow checks the version tag, pushes the image, verifies its registry digest, inspects the immutable image, and records the digest.
- Knit updates its guides, requirements, and development instructions for current application behavior.
- Knit runs tag deployments only when a configured tag pattern matches. It gives unmatched tags a neutral ignored result.
- Knit requires at least one deployment in each configured action.
- Knit processes each webhook request once. It ignores duplicate request IDs and does not retry failed requests.

### Fixed

- Knit reports the same success and failure results in Discord notices and status updates.
- Knit preserves active status when webhook requests overlap or an end event has an invalid request ID.
- Knit applies Discord field and total text limits to embeds.
- Knit encodes GitHub actor names in profile links and file paths in GitHub Contents requests.
- Knit escapes repository text in Discord notices and escapes the version on the landing page.
- Knit keeps the channel topic when an event has no package metadata and preserves keywords under Discord limits.

## 12.0.1 — 2026-10-14

### Added

- Knit returns HTTP 200 after it queues a valid signed webhook. Event processing runs after the response.
- Knit sends commit, repository, ref, event, and request ID values through SSH environment requests.
- Knit cross-posts version-tagged release notices in Discord announcement channels.
- Knit adds focused source modules and matching test suites for webhook, channel, publisher, and notice rules.

### Changed

- Knit uses the repository name after the owner slash for its Discord announcement channel. It encodes punctuation and rejects names above 100 characters.
- Knit checks for an existing announcement channel on each event. It reuses a match or creates the repository name without a suffix.
- Knit sets channel access from repository visibility and sets the topic from package description and keywords before it posts.
- Knit keeps the current channel topic when an event has no package metadata. It rejects keyword text above Discord's topic limit.
- Knit runs tag deployments only when a configured tag pattern matches. It treats unmatched tags as ignored events with a neutral result.
- Knit requires at least one deployment in each configured action.
- Knit tracks pending and completed webhook requests. It ignores duplicate request IDs and does not retry failed requests.
- Knit updates the GHCR image tag to `v12.0.1` and verifies its attestation with the GitHub token.
- Knit updates `dotenv` to `18.0.8` and the package version to `12.0.1`.

### Fixed

- Knit reports the same success and failure results in webhook processing and Discord status updates.
- Knit preserves active status when requests overlap or an end event has an invalid request ID.
- Knit applies field and total text limits to Discord embeds. It limits each field to the total text limit.
- Knit encodes GitHub actor names in profile links and GitHub file paths in Contents requests.
- Knit escapes repository text in Discord notices and escapes the version on the application page.

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
- Removed the tracked `repos/.gitkeep` placeholder. Local checkouts do not require this file.

### Fixed

- Kept webhook event names during target routing.
- Improved target validation, webhook signature checks, rate limits, and request processing.
- Returned a direct client error for malformed JSON webhook requests.
- Encoded repository path components in GitHub Contents requests.
- Escaped repository-controlled Markdown and mentions in Discord event embeds.
- Rejected stale status updates during later or anonymous work.

### Security

- Escaped repository-controlled text before Knit adds it to Discord embeds.
- Encoded repository path components before Knit requests GitHub Contents files.
