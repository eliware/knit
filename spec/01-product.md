# Product

## Positioning

Knit is a deployment observability and recovery console, not a generic infrastructure dashboard.

## Goals

- Understand system state in seconds.
- Trace every webhook to its deployment and notification.
- Explain failures in plain language.
- Recover safely with precise retry scopes.
- Preserve operator trust through visible permissions and audit history.

## Non-goals for MVP

- Arbitrary SSH command execution.
- Direct editing of mounted runtime config.
- Scheduling, promotion pipelines, approvals, and advanced analytics.
- Vanity metrics.

## Principles

- Action-oriented over decorative.
- Immutable event history.
- Safe defaults; broad actions require confirmation.
- Server-side authorization.
- Secrets never returned to the browser.
- Useful empty, loading, disconnected, and failure states.
