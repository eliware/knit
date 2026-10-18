# Realtime and Data Model

## Transport

Use SSE initially. Authenticate the connection, authorize subscriptions, include event IDs, support reconnect cursors, and replay missed events without duplicates. Show disconnected/reconnecting state.

## Core entities

- User: EliD subject, roles, scopes.
- WebhookRequest: ID, event, repository, received time, signature result, payload metadata.
- RoutingDecision: selected config, fallback, cause for ignoring, handler.
- QueueTask: attempts, state, timestamps, error.
- Deployment: immutable run identity, request link, repository, ref, commit, actor, environment, state.
- TargetRun: target, phase, commands, output, exit code, timestamps.
- Notice: destination metadata, state, error, timestamps.
- AuditEntry: actor, action, resource, correlation IDs, result.

## State values

queued, validating, routed, ignored, running, succeeded, failed, retrying, blocked, cancelled, degraded.

## Correlation

Link each request ID to its queue task, deployment ID, target runs, notice, and operator actions.

## Persistence

Keep history and logs after Knit starts again. Define retention and pagination. Do not load unlimited payloads or logs into a browser.
