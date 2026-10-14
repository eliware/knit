import { escapeDiscordMarkdown } from "./notifier/discordMarkdown.mjs";

export const COLORS = {
  release: 0x9b59b6,
  workflow_run: 0x3498db,
  pull_request: 0x2ecc71,
  issues: 0xe67e22,
  deployment: 0x1abc9c,
  deployment_status: 0x1abc9c,
};

function repository(post) {
  return post.repository?.full_name || "Unknown Repository";
}

function actor(post) {
  return post.sender?.login || post.sender?.name || post.pusher?.name || "unknown";
}

function action(post) {
  return post.action || "updated";
}

export function createEmbed({ event, post }) {
  const repo = escapeDiscordMarkdown(repository(post));
  const data =
    post.release ||
    post.workflow_run ||
    post.pull_request ||
    post.issue ||
    post.deployment ||
    post.deployment_status ||
    {};
  const name = escapeDiscordMarkdown(
    data.name || data.title || data.display_title || data.environment || data.ref || "",
  );
  const url = data.html_url || data.url || post.repository?.html_url || undefined;
  const embed = {
    title: `${repo}: ${escapeDiscordMarkdown(event.replaceAll("_", " "))} ${escapeDiscordMarkdown(action(post))}`,
    description: name
      ? `**${name}**\nActor: **${escapeDiscordMarkdown(actor(post))}**`
      : `Actor: **${escapeDiscordMarkdown(actor(post))}**`,
    color: COLORS[event] || 0x3498db,
    footer: { text: `GitHub ${escapeDiscordMarkdown(event)} event` },
    timestamp: new Date().toISOString(),
  };
  if (url) embed.url = url;
  if (data.conclusion)
    embed.description += `\nConclusion: **${escapeDiscordMarkdown(data.conclusion)}**`;
  if (data.state) embed.description += `\nState: **${escapeDiscordMarkdown(data.state)}**`;
  if (data.status) embed.description += `\nStatus: **${escapeDiscordMarkdown(data.status)}**`;
  return embed;
}
