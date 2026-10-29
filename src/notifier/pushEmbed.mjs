import { pushChangeFields } from "./pushChanges.mjs";
import { createPushDescription } from "./pushDescription.mjs";
import { escapeDiscordMarkdown } from "./discordMarkdown.mjs";
import { createPushAuthor } from "./pushAuthor.mjs";

export function createPushEmbed({ post = {}, logOutput, hasError }) {
  if (!post.commits) return null;
  const repository = post.repository?.full_name || "Unknown Repository";

  const embed = {
    title: `New Commits Pushed to ${escapeDiscordMarkdown(repository)}`,
    url: post.repository?.html_url || "",
    color: 0x00ff00,
    timestamp: post.head_commit?.timestamp || new Date().toISOString(),
    thumbnail: { url: "https://knit.eliware.org/assets/knit.png" },
    description: createPushDescription({ post, logOutput, hasError }),
    fields: pushChangeFields(post),
    footer: { text: "GitHub Push Event" },
  };
  embed.author = createPushAuthor(post);
  return embed;
}
