import { tail } from "./embedLimits.mjs";
import { collectPushChanges } from "./pushChanges.mjs";

const DESCRIPTION_LIMIT = 4096;

export function createPushEmbed({ post, logOutput, hasError }) {
  const repository = post.repository?.full_name || "Unknown Repository";
  const files = collectPushChanges(post);

  let description = `Branch: **${post.ref?.replace(/^refs\/heads\//, "") || "unknown"}** - Commits: **${post.commits.length}**\n`;
  for (const commit of post.commits) {
    description += `**${commit.id?.substring(0, 7) || ""}**: [${commit.message || ""}](${commit.url || ""})\n`;
  }
  if (description.length > 1800) description = `${description.slice(0, 1797)}...`;
  if (hasError && logOutput) {
    const available = Math.max(0, DESCRIPTION_LIMIT - description.length - 10);
    description += `\`\`\`text\n${tail(logOutput, available)}\n\`\`\``;
  }

  const embed = {
    title: `New Commits Pushed to ${repository}`,
    url: post.repository?.html_url || "",
    color: 0x00ff00,
    timestamp: post.head_commit?.timestamp || new Date().toISOString(),
    thumbnail: { url: "https://knit.eliware.org/assets/knit.png" },
    description: description.trim(),
    fields: [],
    footer: { text: "GitHub Push Event" },
  };
  const author = { name: post.pusher?.name || "unknown" };
  const icon = post.sender?.avatar_url || post.repository?.owner?.avatar_url;
  if (icon) author.icon_url = icon;
  if (post.pusher?.name) author.url = `https://github.com/${post.pusher.name}`;
  embed.author = author;
  for (const [key, label] of [
    ["added", "New"],
    ["removed", "Deleted"],
    ["modified", "Modified"],
  ]) {
    if (files[key].size) {
      embed.fields.push({
        name: `${label} (${files[key].size})`,
        value: [...files[key]].join("\n"),
        inline: false,
      });
    }
  }
  return embed;
}
