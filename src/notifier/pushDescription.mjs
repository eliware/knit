import { escapeDiscordLinkTarget, escapeDiscordMarkdown } from "./discordMarkdown.mjs";
import { appendErrorLog } from "./errorLog.mjs";

const COMMIT_DESCRIPTION_LIMIT = 1800;

export function createPushDescription({ post, logOutput, hasError }) {
  const branch = escapeDiscordMarkdown(post.ref?.replace(/^refs\/heads\//, "") || "unknown");
  let description = `Branch: **${branch}** - Commits: **${post.commits.length}**\n`;
  for (const commit of post.commits) {
    const id = escapeDiscordMarkdown(commit.id?.substring(0, 7) || "");
    const message = escapeDiscordMarkdown(commit.message || "");
    const url = escapeDiscordLinkTarget(commit.url || "");
    description += `**${id}**: [${message}](${url})\n`;
  }
  if (description.length > COMMIT_DESCRIPTION_LIMIT)
    description = `${description.slice(0, COMMIT_DESCRIPTION_LIMIT - 3)}...`;
  if (hasError && logOutput) description = appendErrorLog(description, logOutput);
  return description.trim();
}
