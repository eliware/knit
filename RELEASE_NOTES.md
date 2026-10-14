# Release Notes

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
