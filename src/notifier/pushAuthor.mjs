import { escapeDiscordMarkdown } from "./discordMarkdown.mjs";

export function createPushAuthor(post) {
  const author = { name: escapeDiscordMarkdown(post.pusher?.name || "unknown") };
  const icon = post.sender?.avatar_url || post.repository?.owner?.avatar_url;
  if (icon) author.icon_url = icon;
  if (post.pusher?.name) author.url = `https://github.com/${encodeURIComponent(post.pusher.name)}`;
  return author;
}
