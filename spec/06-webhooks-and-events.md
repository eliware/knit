# Webhooks and Events

## Delivery list

Columns: received time, repository, event, action, delivery ID, signature status, routing status, deployment status, notification status.

Filters: repository, event, status, failures, date range, delivery ID.

## Routing explanation

For each event show:

- repository match or organization fallback
- selected config
- ignored/matched reason
- handler type
- delivery and deployment correlation

## Payload viewer

Show sanitized, collapsible JSON. Redact authorization headers, signatures, webhook secrets, tokens, private URLs, and sensitive command output.

## Duplicate handling

Display duplicate status and original delivery correlation. Expose bounded deduplication/queue state to operators without exposing internals unnecessarily.
