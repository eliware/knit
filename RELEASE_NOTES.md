# Release Notes

## 12.0.0 — 2026-10-13

### Added

- The HTTP service now shows a service page at `/` and a versioned health result at `/health`.
- Discord now has a localized `/help` command, repository announcement channels, event notices, and run activity.
- Deployment commands now receive the commit, repository, ref, event, and delivery ID as `KNIT_*` values.
- The GHCR workflow now attests and verifies the published image digest.
- End-user guides now cover setup, target settings, repository workflows, Discord access, and faults.

### Changed

- Knit now uses Node.js 26 and the Eliware v12 packages and checks.
- Knit now reads trusted targets from `targets.yaml` and repository workflows from `.knit/deploy.yaml`.
- Knit now reads each workflow at the webhook commit and runs its commands in order through verified SSH.
- Discord notices now cover releases, workflows, pull requests, issues, deployments, and deployment status changes.

### Breaking changes

- Node.js 26 or later is now required.
- Target access now uses a YAML target inventory with SSH identity, known-hosts, and host CA paths.
- Repositories now require a version 1 `.knit/deploy.yaml` file with an absolute working directory.

### Migration

- Create `repos/targets.yaml` or set `KNIT_TARGETS_PATH` to its location.
- Add a `guildId` and at least one valid target to the inventory.
- Add `.knit/deploy.yaml` to each repository. Set each target name, absolute working directory, and command list.
- Set `GITHUB_WEBHOOK_SECRET`. Set both Discord variables or leave both unset.
- Read the [configuration guide](docs/knit-config-guide.md) before service startup.

### Security

- Knit now validates target settings before it opens external connections.
- Knit now rejects webhook requests without a valid GitHub signature.
- Knit now checks workflow file digests and SSH host identity before it runs commands.
