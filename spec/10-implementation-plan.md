# Implementation Plan

## P0

- EliD OIDC login/session.
- Server-side RBAC and audit middleware.
- Persisted webhook/deployment/run history.
- Overview with attention, active deployments, and recent activity.
- Repository activity.
- Deployment detail with unified timeline and grouped logs.
- SSE live updates with reconnect cursors.
- Server-side redaction.
- Retry failed target.
- Webhook delivery detail and safe replay controls.
- Health checks and read-only mode.

## P1

- Command palette and saved filters.
- Read-only effective config viewer and validation.
- Notification delivery status.
- Retry remaining/full deployment.
- Mobile inspection experience.
- Target inventory.
- Config source/revision links.

## P2

- Source-controlled config proposals/diffs.
- Approvals and production gates.
- Promotion workflows.
- Scheduling.
- Insights/analytics.
- Team/tenant management.

## Suggested stack

React + TypeScript, Vite, TanStack Router/Query, CSS variables or Tailwind, CodeMirror/Monaco for future YAML proposals, SSE for realtime.

## Acceptance criteria

- Unauthorized users cannot access protected data or actions.
- Every deployment is traceable from webhook to notification.
- Failed deployments identify exact target, phase, command, and error.
- Retry scope is explicit and idempotent.
- Logs/payloads are redacted before browser delivery.
- Refreshing/reconnecting does not lose or duplicate events.
- History survives service restart.
- Production actions are visually distinct and safely confirmed.
- Keyboard, mobile, reduced-motion, and screen-reader behavior are usable.
