# Core Workflows

## Inspect active deployment

Overview -> active deployment -> deployment detail -> live timeline/logs. Preserve scroll position. If user scrolls up, show a New output marker instead of auto-scrolling.

## Recover failed deployment

1. Show failed target, phase, command, duration, and concise cause.
2. Offer retry failed command/target/remaining targets/full deployment.
3. Default to failed target.
4. Confirm broad retries with repository, ref, commit, targets, and command summary.
5. Require idempotency key and show duplicate-run warning.

## Inspect webhook

Webhooks -> delivery -> sanitized payload metadata -> signature result -> routing decision -> queue attempts -> linked deployment/notification.

## Replay webhook

Preserve original payload and delivery ID. Require permission, explicit replay confirmation, idempotency key, and visible side-effect warning. Never replay silently.

## Inspect config

Repository -> Configuration -> effective validated config, source path/revision, freshness, targets, and validation messages. Do not imply direct save. Future changes should produce a source-controlled proposal/diff.

## Operational modes

Support normal, read-only/maintenance, and degraded states. In read-only mode allow inspection but disable retries, replays, and mutations with clear reasons.
