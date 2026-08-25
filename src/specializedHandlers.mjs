import { log as logger } from '@eliware/common';
import * as Notifier from './notifier.mjs';

const COLORS = {
  release: 0x9B59B6,
  workflow_run: 0x3498DB,
  pull_request: 0x2ECC71,
  issues: 0xE67E22,
  deployment: 0x1ABC9C,
  deployment_status: 0x1ABC9C,
};

function repository(post) {
  return post.repository?.full_name || 'Unknown Repository';
}

function actor(post) {
  return post.sender?.login || post.sender?.name || post.pusher?.name || 'unknown';
}

function action(post) {
  return post.action || 'updated';
}

export function createEmbed({ event, post }) {
  const repo = repository(post);
  const data = post.release || post.workflow_run || post.pull_request || post.issue || post.deployment || post.deployment_status || {};
  const name = data.name || data.title || data.display_title || data.environment || data.ref || '';
  const url = data.html_url || data.url || post.repository?.html_url || undefined;
  const embed = {
    title: `${repo}: ${event.replaceAll('_', ' ')} ${action(post)}`,
    description: name ? `**${name}**\nActor: **${actor(post)}**` : `Actor: **${actor(post)}**`,
    color: COLORS[event] || 0x3498DB,
    footer: { text: `GitHub ${event} event` },
    timestamp: new Date().toISOString(),
  };
  if (url) embed.url = url;
  if (data.conclusion) embed.description += `\nConclusion: **${data.conclusion}**`;
  if (data.state) embed.description += `\nState: **${data.state}**`;
  if (data.status) embed.description += `\nStatus: **${data.status}**`;
  return embed;
}

export function createHandler({ event, Notifier: NotifierMod = Notifier } = {}) {
  return async ({ post, target, log = logger }) => {
    if (!post?.repository?.full_name) return true;
    await NotifierMod.send({
      post,
      event,
      embed: createEmbed({ event, post }),
      logOutput: '',
      hasError: false,
      log,
    });
    return true;
  };
}

export function registerSpecializedHandlers(registry, { Notifier: NotifierMod = Notifier } = {}) {
  for (const event of Object.keys(COLORS)) registry.register(event, createHandler({ event, Notifier: NotifierMod }));
  return registry;
}

export const specializedEvents = Object.keys(COLORS);
