# Release Notes

## 2.2.0 — August 27, 2026

### Added

- Added safe webhook metadata environment variables for deployment commands, including the exact triggering commit SHA, repository, ref, event, and delivery ID.
- Added bounded per-deployment command timeouts up to five minutes, preserving existing failure and retry behavior.
- Added an AI-agent-oriented configuration guide covering workflow authoring, validation scripts, target tools, metadata, timeouts, and safety.

### Changed

- Isolated webhook environment construction into a dedicated module.
- Organized notifier implementation and tests under dedicated subfolders without changing the public notifier API.
- Documented the command metadata and timeout workflow interface.
- Refreshed package metadata and dependency versions, and recorded the approved native dependency install scripts.

### Verification

- Tests: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.
- Dependency audit: **0 vulnerabilities**.
- Package dry-run: **`@eliware/knit@2.2.0`**.

## 2.1.1 — August 25, 2026

### Fixed

- Fixed deployments targeting filesystem root (`/`) being incorrectly rejected as outside the trusted target root.
- Added regression coverage for root-scoped target cwd validation.

### Verification

- Tests: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.

## 2.1.0 — August 25, 2026

### Added

- Added repository-owned `.knit/deploy.yaml` workflows with target-specific push actions and optional `v*` tag actions.
- Added GitHub Contents API workflow loading pinned to the webhook commit, including package metadata for notifications.
- Added automatic Discord Announcement channel creation and synchronization by repository name.
- Added repository visibility synchronization, read-only channel permissions, package description/keyword topics, and release announcement cross-posting.
- Added trusted GitOps target inventories with a shared Discord guild ID and strict SSH host CA support.

### Changed

- Removed central per-project deployment and Discord channel configuration.
- Removed the temporary Git checkout requirement from workflow inspection.
- Added local Compose mounts for production-like SSH testing.
- Updated runtime dependencies and CI validation for the modern workflow.

### Verification

- Tests: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.
- Local container build, health check, signed webhook, real `dev` SSH deployment, and Discord notification smoke test passed.

## 1.1.13 — August 22, 2026

### Changed

- Stopped checking mounted configuration file metadata for live changes; Knit now uses the process-lifetime config cache.
- Documented GitOps content-hashed ConfigMap rollouts as the configuration reload mechanism.

### Verification

- Config-loader tests: **8 tests passed**.
- Strict preflight: Jest 100x4 coverage, Oxlint, and production dependency audit passed.

## 1.1.12 — August 21, 2026

### Changed

- Replaced Discord webhook notifications with direct Discord bot channel messages using `@eliware/discord` and configured channel snowflakes.
- Migrated repository notification configuration to plaintext YAML; runtime secrets remain limited to Discord credentials, GitHub webhook signing, and SSH assets.
- Added a Knit landing page at `GET /` while preserving signed GitHub webhooks at `POST /`.
- Added complete edge-case coverage for Discord startup, shutdown, channel lookup, and notification failures.
- Updated `inquirer`, `js-yaml`, and `oxlint` to their latest compatible versions.

### Verification

- Jest: **170 tests passed**; coverage **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.
- Production dependency audit: **0 vulnerabilities**.
- Local `/health` and `GET /` smoke checks passed.

## 1.1.11 — August 10, 2026

### Changed

- Fixed absolute SSH identity and known-host path resolution.
- Added regression coverage for mounted Kubernetes SSH secrets.
- Added the Knit web UI product and implementation specification.
- Updated `@eliware/common` to 1.1.8.

### Verification

- Jest: **159 tests passed**; coverage **100%**.
- Oxlint: **0 warnings/errors**.
- Production dependency audit: **0 vulnerabilities**.

## 1.1.10 — August 8, 2026

### Changed

- Restored `eliware/knit` self-deployment configuration and organization-level fallback notifications.
- Added mounted SSH deployment credentials for configured targets.
- Removed graceful self-restart/lifecycle handling; Knit code updates use immutable images and Argo CD.

### Verification

- Jest: **158 tests passed**; coverage **100%**.
- Oxlint: **0 warnings/errors**.
- Local Docker image build, CI, GHCR publish, Argo rollout, health check, and signed webhook smoke tests verified.

## 1.1.9 — August 8, 2026

- Restored organization fallback routing and the `eliware/knit` deployment configuration.

## 1.1.8 — August 8, 2026

### Changed

- Migrated repository configuration to YAML and Kubernetes ConfigMaps.
- Moved Discord webhook URLs into encrypted Kubernetes Secrets referenced by `notifyKey`.
- Removed age-encrypted config handling, config-repository synchronization, and local execution from the 1.1.8 runtime; later releases restore only webhook-driven SSH deployment for `eliware/knit`.
- Simplified the container image and removed Git/age runtime dependencies.
- Added strict SSH-only modern targets and updated runtime documentation.

### Verification

- Jest: **163 tests passed**.
- Coverage: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.
- Docker image build and Kustomize rendering verified.


## 1.1.7 — August 6, 2026

- Aligned Docker Compose with Kubernetes runtime behavior.
- Added a 30-second graceful shutdown window and automatic image rebuild policy.
- Verified Compose configuration and successfully rebuilt the container image.

## 1.1.6 — August 6, 2026

### Added

- GHCR container publishing workflow for version tags and manual dispatch.
- Tracked `repos/.gitkeep` placeholder so clean checkouts retain the runtime directory.

### Changed

- Node.js CI now installs the `age` command-line tool required by the crypto test suite.
- Container and CI workflows remain compatible with the encrypted configuration runtime.

### Verification

- Jest: **200 tests passed**.
- Coverage: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.

## 1.1.5 — August 6, 2026

This release completes the encrypted configuration, SSH deployment, container-runtime, and operational hardening work since 1.1.4.

### Added

- Age-encrypted repository configuration loading and runtime SSH asset decryption.
- Modern sequential local and SSH deployment targets with strict host verification.
- Graceful FIFO queue draining before supervised restarts.
- Dockerfile, Docker Compose deployment, startup checkout synchronization, mounted secrets, and `/health` support.
- GHCR container publishing workflow for version tags and manual dispatch.
- Expanded event-aware Discord notifications with safe truncation and preserved repository context.
- Comprehensive focused tests for crypto, lifecycle, configuration validation, local/SSH execution, and notifications.

### Changed

- Container startup refreshes the Knit and `knit-configs` checkouts before launching the service.
- Containerized SSH deployments use encrypted config-repository identities instead of host-installed keys.
- Systemd restart behavior was hardened with immediate restart and burst limiting; the current host uses Compose instead.
- Tests isolate environment-dependent encryption and wizard configuration paths.
- Documentation was refreshed for encrypted configs, Docker operation, SSH targets, graceful restarts, and rollback procedures.

### Verification

- Jest: **200 tests passed**.
- Coverage: **100% statements, branches, functions, and lines**.
- Oxlint: **0 warnings/errors**.
- Docker image build, Compose startup, health check, and container SSH connectivity verified.

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
- Historical release behavior: repository configurations used `npm install --silent` for live working-tree updates.

## Unreleased

- Standardized the test dependency on `@eliware/test` 2.x.
- Added the standard audit and package dry-run CI gates.
- Gated npm and GHCR publication on passing Ubuntu and Windows validation.
- Scoped workflow permissions to the jobs that require them.
- Included release notes in the published package files.
## 2.0.0

Major conventions and release-pipeline alignment:

### Changed

- Upgraded the baseline tooling to `@eliware/test` 2.x with 100×4 coverage
  and zero-warning lint enforcement.
- Standardized CI to run tests, lint, production audit, and package dry-run
  checks on Ubuntu and Windows for pushes, pull requests, and `v*` tags.
- Gated npm and GHCR publication on successful Ubuntu and Windows validation.
- Scoped workflow permissions to the publishing jobs that require them.
- Removed the obsolete standalone coverage-gap script and `.jest.result`
  ignore.
- Published release notes with the package and clarified command-driven SSH
  deployment behavior in the README.

### Verification

- `npm test`: 100×4 coverage.
- `npm run lint`: 0 warnings.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilities.
- `npm run pack`: passed.
