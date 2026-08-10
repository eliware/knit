# Realtime and Data Model

## Transport

Use SSE initially. Authenticate the connection, authorize subscriptions, include event IDs, support reconnect cursors, and replay missed events without duplicates. Show disconnected/reconnecting state.

## Core entities

- User: EliD subject, roles, scopes.
- WebhookDelivery: ID, event, repository, received time, signature result, payload metadata.
- RoutingDecision: selected config, fallback, ignored reason, handler.
- QueueTask: attempts, state, timestamps, error.
- Deployment: immutable run identity, delivery link, repository, ref, commit, actor, environment, state.
- TargetRun: target, phase, commands, output, exit code, timestamps.
- NotificationDelivery: destination metadata, state, error, timestamps.
- AuditEntry: actor, action, resource, correlation IDs, result.

## State values

queued, validating, routed, ignored, running, succeeded, failed, retrying, blocked, cancelled, degraded.

## Correlation

Every UI trace must link delivery ID -> queue task -> deployment ID -> target runs -> notification -> operator actions.

## Persistence

History and logs must survive process restart. Define retention and pagination. Avoid loading unbounded payloads/logs into the browser.
