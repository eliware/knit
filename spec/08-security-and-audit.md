# Access Control and Audit

## Secrets

Do not return or show OAuth tokens, refresh tokens, private keys, webhook URLs, signatures, authorization headers, or secret contents. Remove secret values before storage and before sending data to a browser.

Expose secret health/status only.

## Deployment safety

- No arbitrary commands from UI.
- Use commands only from validated repository config.
- Strict SSH host verification remains mandatory.
- Show exact target/ref/commit before broad retry.
- Per-repository and per-target locks.
- Rate-limit retry, replay, and test notification actions.

## Audit

Keep audit records for privileged and sensitive actions. Record payload or log views, copies, downloads, retries, replays, config proposals, notification tests, and access changes.

Record actor, EliD subject, roles, action, resource, repository, target, commit, request ID, correlation IDs, source IP, user agent, time, result, and cause. Prevent ordinary users from changing audit records.

## Data isolation

Apply repository and environment access checks to SSE, APIs, logs, downloads, and filters. Prevent event data from reaching a different user or repository.
