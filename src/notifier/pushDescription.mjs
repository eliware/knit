import { DISCORD_EMBED_DESCRIPTION_LIMIT, tail } from "./embedLimits.mjs";
import {
  escapeDiscordCode,
  escapeDiscordLinkTarget,
  escapeDiscordMarkdown,
} from "./discordMarkdown.mjs";

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
  if (hasError && logOutput) {
    const start = "```text\n";
    const end = "\n```";
    const available = Math.max(
      0,
      DISCORD_EMBED_DESCRIPTION_LIMIT - description.length - start.length - end.length,
    );
    description += `${start}${escapeDiscordCode(tail(logOutput, available))}${end}`;
  }
  return description.trim();
}
