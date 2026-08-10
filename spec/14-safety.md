# Safety Controls

- No arbitrary shell input.
- Retry failed target is the default recovery action.
- Broad retries show exact targets, ref, commit, and commands before confirmation.
- Use idempotency keys and duplicate-run warnings.
- Per-repository and per-target deployment locks.
- Replay shows original payload, side effects, and scope.
- Cancellation is unavailable unless backend semantics are genuinely safe.
- Maintenance/read-only mode disables mutations while preserving inspection.
- Production is visually distinct and may require step-up auth/approval.
- Rate-limit retries, replays, notification tests, and downloads.
