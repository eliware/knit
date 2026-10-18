# Information Architecture

## Primary navigation

- Overview
- Repositories
- Deployments
- Webhooks
- Targets
- Notifications
- System

Use a slim collapsible rail on desktop. On mobile show links for Overview, Deployments, Repositories, and More.

## Global UI

- Command palette and filters.
- Current user, role, session state, and logout.
- Global status/connection indicator.
- Show a toast after an action completes. Keep each operational error until it clears.

## Pages

### Overview

Show items that require action, active deployments, and recent work. Include queue depth, recent failure rate, deployment latency, and the last completed deployment when useful.

### Repository

Show identity, branch/ref, latest commit, status, last completed deployment, targets, work, deployments, config checks, and notifications.

### Deployment

Primary screen. See `05-deployment-detail.md`.

### Webhooks

Request list, request information, routing explanation, linked deployment, and safe replay.

### Targets

Show the full inventory and recent health. Use repository configuration as the source for target data.

### Notifications

Discord destination status, recent deliveries, failures, and test action.

### System

Knit version, uptime, queue, history, config mounts, EliD, SSH assets, GitHub, and Discord health.
