# Security and Audit

## Secrets

Never return or display OAuth tokens, refresh tokens, private keys, webhook URLs, signatures, authorization headers, or secret contents. Redact before persistence and before browser delivery.

Expose secret health/status only.

## Deployment safety

- No arbitrary commands from UI.
- Commands originate only from validated repository config.
- Strict SSH host verification remains mandatory.
- Show exact target/ref/commit before broad retry.
- Per-repository and per-target locks.
- Rate-limit retry, replay, and test notification actions.

## Audit

Append-only audit records for privileged and sensitive actions, including viewing/copying/download of payloads/logs, retries, replays, config proposals, notification tests, and access changes.

Record actor, EliD subject, roles, action, resource, repository, target, commit, request ID, correlation IDs, source IP, user agent, timestamp, result, and reason. Protect audit records from ordinary modification.

## Data isolation

SSE, APIs, logs, downloads, and search must enforce repository/environment authorization. No cross-user or cross-repository event leakage.
