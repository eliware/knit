# Application goals

## Positioning

Knit is a console for deployment status and fault recovery. It is not a general infrastructure dashboard.

## Goals

- Understand system state in seconds.
- Link each webhook to its deployment and notice.
- Describe failures in plain language.
- Restore work safely with accurate retry scopes.
- Show permissions and audit history to build operator trust.

## Non-goals for MVP

- Arbitrary SSH command execution.
- Direct editing of mounted runtime config.
- Scheduling, promotion pipelines, approvals, and advanced analytics.
- Vanity metrics.

## Principles

- Prioritize actions. Limit decoration.
- Immutable event history.
- Use safe defaults. Require confirmation for broad actions.
- Server-side authorization.
- Do not return secrets to the browser.
- Useful empty, loading, disconnected, and failure states.
