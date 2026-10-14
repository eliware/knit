import { DISCORD_EMBED_DESCRIPTION_LIMIT, tail } from "./embedLimits.mjs";

const COMMIT_DESCRIPTION_LIMIT = 1800;

export function createPushDescription({ post, logOutput, hasError }) {
  let description = `Branch: **${post.ref?.replace(/^refs\/heads\//, "") || "unknown"}** - Commits: **${post.commits.length}**\n`;
  for (const commit of post.commits) {
    description += `**${commit.id?.substring(0, 7) || ""}**: [${commit.message || ""}](${commit.url || ""})\n`;
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
    description += `${start}${tail(logOutput, available)}${end}`;
  }
  return description.trim();
}
