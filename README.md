# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/knit [![npm version](https://img.shields.io/npm/v/@eliware/knit.svg)](https://www.npmjs.com/package/@eliware/knit)[![license](https://img.shields.io/github/license/eliware/knit.svg)](LICENSE)[![build status](https://github.com/eliware/knit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/knit/actions)

A GitHub webhook handler and deployment automation tool. Knit listens for GitHub webhook events, validates signatures, updates local repositories, runs deployment commands, and sends notifications (e.g., to Discord). Use this as a foundation for automating deployments and notifications for your projects.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Repository configuration](#repository-configuration)
- [Customization](#customization)
- [Support](#support)
- [License](#license)

## Features

- GitHub webhook listener (Express server)
- Signature validation for security
- Automated repository updates and deployment commands
- Discord webhook notifications for deployments and errors
- Interactive CLI wizard for repository configuration
- Pre-configured for Node.js (ESM)
- Environment variable support via dotenv
- Logging and signal handling via `@eliware/common`
- Jest for testing
- MIT License

## Getting Started

1. **Clone this template:**

   ```bash
   git clone https://github.com/eliware/knit.git
   cd knit
   npm install
   ```

2. **Update project details:**
   - Edit `package.json` (name, description, author, etc.)
   - Update this `README.md` as needed
   - Change the license if required

3. **Configure your repositories:**
   - Run the interactive wizard:

     ```bash
     ./wizard.mjs
     ```

   - This will guide you through setting up deployment paths, commands, and notification URLs for each repository.

4. **Set up your GitHub webhook:**
   - Point your repository’s webhook to your Knit server URL (e.g., `https://yourdomain.com/`)
   - Use content type `application/json`
   - Set the webhook secret to match your `.env` file’s `GITHUB_WEBHOOK_SECRET`

## Repository configuration

Each repository configuration contains `pwd`, optional `pre` and `post` command arrays, optional `user`/`group`, and an optional `notify` value.

A notification can be a legacy webhook URL string:

```json
{
  "notify": "https://discord.com/api/webhooks/..."
}
```

Or an object that passes delivery options through `@eliware/discord-webhook`:

```json
{
  "notify": {
    "url": "https://discord.com/api/webhooks/...",
    "maxRetries": 3,
    "timeoutMs": 30000,
    "wait": false,
    "threadId": "1234567890"
  }
}
```

Supported delivery options are `maxRetries`, `timeoutMs`, `wait`, `threadId`, and `threadName`. Knit validates Discord embed limits before sending, preserves the tail of oversized deployment logs, and reports delivery failures with repository/event context.

## Development

- Main entry: `knit.mjs`
- Start your app:

  ```bash
  ./knit.mjs
  ```

- Add your code in new files and import as needed.

## Testing

- Run tests with:

  ```bash
  npm test
  ```

- Add your tests in the `tests` folder or alongside your code.

## Customization

- Extend the logging, notification, or deployment logic as needed.
- Add dependencies and scripts to fit your project.
- Remove or modify template files and sections.

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

## License

[MIT © 2025 Eli Sterling, eliware.org](LICENSE)

## Links


- [Home Page](https://eliware.org)
- [GitHub Repo](https://github.com/eliware/knit)
- [GitHub Org](https://github.com/eliware)
- [GitHub Personal](https://github.com/reliware)
- [Discord](https://discord.gg/M6aTR9eTwN)
