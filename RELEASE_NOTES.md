# Release Notes

## 1.1.3 — Current changes

This release expands Knit from push-focused deployment handling into a broader GitHub event routing and notification system, while completing comprehensive test coverage.

### Added

- Event routing for repository and organization-level GitHub events.
- Fallback routing for non-repository events through `eliware/knit`.
- Bounded duplicate-delivery suppression using GitHub delivery IDs.
- Event handler registry with generic catch-all handling.
- Specialized handlers and Discord embeds for:
  - Releases
  - Workflow runs
  - Pull requests
  - Issues
  - Deployments
  - Deployment statuses
- Retry handling for failed consumer processing.
- Publisher metrics for queued, processed, successful, failed, retried, and duplicate deliveries.
- `npm run test:gaps` coverage-gap reporting command.
- `.agentx*` temporary-file ignore rule.

### Changed

- GitHub validation now supports organization-level and non-push events.
- Existing push and tag deployment behavior remains compatible.
- Discord notifications now include event names, actions, actors, statuses, conclusions, and event-specific colors.
- Publisher logging now tolerates loggers without a `warn()` method.
- Wizard configuration persistence and dependency-default paths were hardened.

### Verification

- Jest: **147 tests passed**.
- Coverage: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.

## 1.1.2 — July 29, 2026

- Previous tagged release baseline.
- Package metadata and dependency lockfile updates.

## 1.1.1 — July 29, 2026

- Initial tagged package release baseline.
- Package metadata and dependency lockfile updates.

## Historical commits

- `d50356b` — first commit.
- Additional pre-release maintenance commits preceded tag `1.1.1`.

## 1.1.4

- Added automatic pushback commits after successful post-update commands.
- Pushback commits use the `Pushback YYYY-MM-DD HH:mm:ss` format and are pushed automatically.
- Repository configurations use `npm install --silent` for live working-tree updates.
