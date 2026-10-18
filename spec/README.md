# Knit Web Console Specification

This specification describes an authenticated console for deployment status and fault recovery.

## Main tasks

Use the console to answer these questions:

1. Is a fault active?
2. Which repository has an active deployment?
3. Which action must follow?

Show the full flow from webhook receipt through validation, routing, queueing, SSH work, and Discord notices. Do not expose secrets or allow arbitrary shell commands.

## Documents

- `01-product.md` describes goals, rules, and scope.
- `02-information-architecture.md` describes navigation and page structure.
- `03-visual-design.md` describes the visual style.
- `04-core-workflows.md` describes operator tasks and expected behavior.
- `05-deployment-detail.md` describes the deployment view.
- `06-webhooks-and-events.md` describes request, routing, and replay views.
- `07-authentication-authorization.md` describes EliD login, sessions, and access roles.
- `08-security-and-audit.md` describes secret removal, audit, and safe operation.
- `09-realtime-and-data-model.md` describes APIs, SSE, data items, and states.
- `10-implementation-plan.md` describes work phases and done checks.
- `11-components.md` describes shared interface components.
- `12-dashboard.md` describes the overview page.
- `13-configuration.md` describes config views and change proposals.
- `14-safety.md` describes retry, replay, and production safeguards.
- `15-accessibility-and-responsive.md` describes accessibility and screen sizes.
- `16-api-contract.md` describes interface requirements for APIs.

## Current system

Knit accepts GitHub webhooks, queues and deduplicates events, reads YAML settings, and runs deployment steps through strict SSH checks. Knit sends event notices to Discord. Keep config files in source control and attach them at runtime. A future proposal flow can add reviewed edits.
