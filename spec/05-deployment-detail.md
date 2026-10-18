# Deployment View

## Identity header

Show status, repository, ref, commit, actor, trigger event, request ID, deployment ID, start time, elapsed time, and environment.

## Unified timeline

Webhook received -> signature checked -> routed/ignored -> queued -> consumer runs -> target execution -> notice -> completed.

Timeline entries are immutable and link to related objects.

## Target stages

For each target, show its name, host (not credentials), working directory, status, elapsed time, and phase. Show pre commands, Git sync, post commands, stdout/stderr, and exit code when requested.

## Logs

- Server-side redacted before storage/streaming/download.
- Terminal-like but readable.
- Add filters, a time label toggle, line length control, copy/download, output follow, and error navigation.
- Group by target and command.
- Keep a plain-language error summary above raw output.
- Preserve logs after Knit starts again.

## Actions

Allow a retry for a failed target, remaining targets, or the full deployment. Allow a webhook replay when permitted. Allow ID copies. Offer cancellation only when the backend can stop work safely.
