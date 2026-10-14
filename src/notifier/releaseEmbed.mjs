import { escapeDiscordMarkdown } from "./discordMarkdown.mjs";

export function createReleaseEmbed(post) {
  const repository = post.repository?.full_name || "Unknown Repository";
  const tag = post.ref.replace("refs/tags/", "");
  const name = escapeDiscordMarkdown(repository.split("/").pop());
  const url =
    repository && tag
      ? `https://github.com/${repository}/releases/tag/${encodeURIComponent(tag)}`
      : post.repository?.html_url || "";
  const embed = {
    title: `${name} ${escapeDiscordMarkdown(tag)} has been released! 🎉`,
    url,
    color: 0xffd700,
    timestamp: new Date().toISOString(),
    thumbnail: { url: "https://eliware.org/logos/eliware_64.png" },
    footer: { text: "GitHub Tag Push Event" },
  };
  const icon = post.sender?.avatar_url || post.repository?.owner?.avatar_url;
  const author = { name: escapeDiscordMarkdown(post.pusher?.name || "unknown") };
  if (icon) author.icon_url = icon;
  if (post.pusher?.name) author.url = `https://github.com/${encodeURIComponent(post.pusher.name)}`;
  embed.author = author;
  return embed;
}
