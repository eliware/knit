# UI API Contract

Required resource families:

- `/api/me`
- `/api/overview`
- `/api/repositories`
- `/api/deployments`
- `/api/deployments/:id/actions/retry`
- `/api/webhooks`
- `/api/webhooks/:id/replay`
- `/api/targets`
- `/api/notifications`
- `/api/system/health`
- `/api/audit`
- `/api/events` (SSE)

All list endpoints need pagination, filtering, stable cursors, authorization filtering, and structured errors. Mutations require idempotency keys and return correlation IDs. Payloads/logs are redacted server-side. SSE events include monotonically ordered IDs and support `Last-Event-ID`.
