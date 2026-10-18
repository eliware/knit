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

All list endpoints must support pagination, filters, stable cursors, access checks, and structured errors. Mutations require idempotency keys and return correlation IDs. Remove secrets from payloads and logs on the server. SSE events include ordered IDs and support `Last-Event-ID`.
