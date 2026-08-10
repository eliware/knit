# Information Architecture

## Primary navigation

- Overview
- Repositories
- Deployments
- Webhooks
- Targets
- Notifications
- System

Use a slim collapsible rail on desktop. On mobile use bottom navigation for Overview, Deployments, Repositories, and More.

## Global UI

- Command palette/search.
- Current user, role, session state, and logout.
- Global status/connection indicator.
- Toasts for completed actions; persistent inline errors for operational failures.

## Pages

### Overview

Show Attention Required, Active Deployments, and Recent Activity. Include queue depth, recent failure rate, deployment latency, and last successful deployment only when actionable.

### Repository

Show identity, branch/ref, latest commit, status, last successful deployment, targets, activity, deployments, config validation, and notifications.

### Deployment

Primary screen. See `05-deployment-detail.md`.

### Webhooks

Delivery list, delivery detail, routing explanation, linked deployment, and safe replay.

### Targets

Global inventory and recent health; repository configuration remains canonical for target context.

### Notifications

Discord destination status, recent deliveries, failures, and test action.

### System

Service version, uptime, queue, storage/history, config mounts, EliD, SSH assets, GitHub, and Discord health.
