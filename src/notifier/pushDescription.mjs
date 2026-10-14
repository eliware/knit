import { DISCORD_EMBED_DESCRIPTION_LIMIT } from "./embedLimits.mjs";
import { escapeDiscordLinkTarget, escapeDiscordMarkdown } from "./discordMarkdown.mjs";
import { renderErrorLog } from "./errorLog.mjs";

const COMMIT_DESCRIPTION_LIMIT = 1800;
const ERROR_LOG_WRAPPER_LENGTH = 12;

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
  if (hasError && logOutput) {
    const available = Math.max(
      0,
      DISCORD_EMBED_DESCRIPTION_LIMIT - description.length - ERROR_LOG_WRAPPER_LENGTH,
    );
    description += renderErrorLog(logOutput, available);
  }
  return description.trim();
}
