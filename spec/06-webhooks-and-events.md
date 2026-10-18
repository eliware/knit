# Webhooks and Events

## Request list

Show received time, repository, event, action, request ID, signature status, routing status, deployment status, and notice status.

Allow filters for repository, event, status, failures, date range, and request ID.

## Routing explanation

For each event show:

- repository match or organization fallback
- selected config
- why the event matched or was ignored
- handler type
- request and deployment links

## Payload viewer

Show sanitized, collapsible JSON. Redact authorization headers, signatures, webhook secrets, tokens, private URLs, and sensitive command output.

## Duplicate handling

Show duplicate status and link the first request. Show queue state without exposing internal data.
