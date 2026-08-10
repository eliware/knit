# Deployment Detail

## Identity header

Show status, repository, ref, commit, actor, trigger event, delivery ID, deployment ID, start time, duration, and environment.

## Unified timeline

Webhook received -> signature validated -> routed/ignored -> queued -> consumer attempt(s) -> target execution -> notification -> completed.

Timeline entries are immutable and link to related objects.

## Target stages

For every target show name, host (not credentials), working directory, status, duration, and phase. Expand into pre commands, git synchronization, post commands, stdout/stderr, and exit code.

## Logs

- Server-side redacted before storage/streaming/download.
- Terminal-like but readable.
- Search, timestamps toggle, wrap toggle, copy/download, follow output, jump to error.
- Group by target and command.
- Sticky plain-language error summary above raw output.
- Preserve logs after process restart.

## Actions

Retry failed target, retry remaining targets, retry full deployment, replay source webhook where permitted, and copy IDs. Cancellation must only be offered if the backend can safely implement it.
