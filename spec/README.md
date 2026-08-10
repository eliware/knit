# Knit Web UI Specification

Implementation-oriented product specification for the Knit deployment observability console.

## Product

Knit UI is a calm, authenticated operations console for answering:

1. Is anything broken?
2. What is deploying now?
3. What should I do next?

It observes the complete flow: webhook receipt, validation, routing, queueing, SSH deployment, and Discord notification. It must not expose secrets or provide arbitrary shell execution.

## Documents

- `01-product.md` — product goals, principles, and scope
- `02-information-architecture.md` — navigation and page structure
- `03-visual-design.md` — aesthetic and design system
- `04-core-workflows.md` — operator journeys and behavior
- `05-deployment-detail.md` — primary deployment/run experience
- `06-webhooks-and-events.md` — delivery, routing, replay UX
- `07-authentication-authorization.md` — EliD OAuth/OIDC, sessions, RBAC
- `08-security-and-audit.md` — redaction, audit, operational safeguards
- `09-realtime-and-data-model.md` — API, SSE, entities, state model
- `10-implementation-plan.md` — phased delivery and acceptance criteria
- `11-components.md` — shared component behavior
- `12-dashboard.md` — overview layout
- `13-configuration.md` — config viewer/proposal rules
- `14-safety.md` — retry/replay/production safeguards
- `15-accessibility-and-responsive.md` — accessibility and responsive behavior
- `16-api-contract.md` — UI-facing API requirements

## Source of truth

Knit currently receives GitHub webhooks, queues/deduplicates events, loads mounted YAML configuration, deploys sequentially over strict SSH, and sends Discord notifications. Config files remain source-controlled/runtime-mounted unless a future proposal workflow is implemented.
