import { pushChangeFields } from "./pushChanges.mjs";
import { createPushDescription } from "./pushDescription.mjs";

export function createPushEmbed({ post, logOutput, hasError }) {
  const repository = post.repository?.full_name || "Unknown Repository";

  const embed = {
    title: `New Commits Pushed to ${repository}`,
    url: post.repository?.html_url || "",
    color: 0x00ff00,
    timestamp: post.head_commit?.timestamp || new Date().toISOString(),
    thumbnail: { url: "https://knit.eliware.org/assets/knit.png" },
    description: createPushDescription({ post, logOutput, hasError }),
    fields: pushChangeFields(post),
    footer: { text: "GitHub Push Event" },
  };
  const author = { name: post.pusher?.name || "unknown" };
  const icon = post.sender?.avatar_url || post.repository?.owner?.avatar_url;
  if (icon) author.icon_url = icon;
  if (post.pusher?.name) author.url = `https://github.com/${post.pusher.name}`;
  embed.author = author;
  return embed;
}
