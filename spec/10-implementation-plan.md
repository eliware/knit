# Implementation Plan

## P0

- EliD OIDC login/session.
- Server-side RBAC and audit middleware.
- Persisted webhook/deployment/run history.
- Overview with items that require action, active deployments, and recent work.
- Repository work.
- Deployment view with one timeline and grouped logs.
- SSE live updates with reconnect cursors.
- Server-side redaction.
- Retry failed target.
- Webhook request information and safe replay controls.
- Health checks and read-only mode.

## P1

- Command palette and saved filters.
- Read-only config viewer and validation.
- Notification status.
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

## Done criteria

- Users without approval cannot access protected data or actions.
- Each deployment links to its webhook and notice.
- Failed deployments identify exact target, phase, command, and error.
- Retry scope is explicit and idempotent.
- Redact logs and payloads before sending them to a browser.
- Refreshing/reconnecting does not remove or duplicate events.
- Keep history after Knit starts again.
- Production actions are visually distinct and safely confirmed.
- Keyboard, mobile, reduced-motion, and screen-reader behavior are usable.
