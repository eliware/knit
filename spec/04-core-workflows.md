# Core Workflows

## Inspect active deployment

Overview -> active deployment -> deployment view -> live timeline/logs. Keep the scroll location. If a user scrolls up, show a New output marker. Do not auto-scroll.

## Restore failed deployment

1. Show the failed target, phase, command, elapsed time, and cause.
2. Offer retry failed command/target/remaining targets/full deployment.
3. Default to failed target.
4. Confirm broad retries with repository, ref, commit, targets, and command summary.
5. Require idempotency key and show duplicate-run warning.

## Inspect webhook

Webhooks -> request -> sanitized payload metadata -> signature result -> routing decision -> queue attempts -> linked deployment/notification.

## Replay webhook

Keep the first payload and request ID. Require permission, explicit replay confirmation, and an idempotency key. Show a side-effect warning. Require confirmation for each replay.

## Inspect config

Repository -> Configuration -> validated config in use, source path/revision, freshness, targets, and validation messages. Do not suggest direct save. Require future changes to create a source-controlled proposal and diff.

## Operational modes

Support standard, read-only/maintenance, and degraded states. In read-only mode, allow inspection and disable retries, replays, and changes. Show why each action is disabled.
