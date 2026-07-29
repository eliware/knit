# AGENTS.md (/opt/knit)

Project context:

- knit is @eliware/knit, a GitHub webhook handler and deployment automation tool.
- It listens for GitHub webhook events, validates signatures, updates repositories, runs deployment commands, and sends notifications.
- The service is documented as a DevOps engine for repository and workflow automation.
- It is deployed on the dev workstation and routed publicly at knit.eliware.org / knit-3456 per the platform docs.

Repository layout:

- knit.mjs — main entry point for the service
- wizard.mjs — interactive configuration wizard
- src/ — application modules
- tests/ — Jest test suite
- assets/ — static images and branding
- repos/ — local repository working area
- knit.service — systemd unit file

Operational notes:

- Read README.md before changing behavior.
- Keep changes focused and consistent with the existing ES module style.
- Update or add Jest tests for behavioral changes.
- Run npm test after modifying logic.
- Use .env.example as the template for environment configuration.
- Be careful with deployment-related changes: this service can trigger repository updates and downstream automation.
- Avoid broad rewrites unless explicitly requested.

Environment and deployment:

- Main runtime entry is npm start or node knit.mjs.
- The package uses Jest with the Node test environment.
- Dependencies include express, inquirer, dotenv, @eliware/common, and @eliware/discord-webhook.
- If changes affect service startup, webhook routing, or deployment behavior, verify the relevant tests and service unit expectations.

Helpful references:

- /docs/projects/knit.md
- /docs/services/dev-workstation.md
- /docs/services/service-maps.md
- /docs/domains/eliware-org.md
- /docs/networking/core1-core2.md
