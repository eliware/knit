import __knitModule0 from "./discordMarkdown.mjs";
import __knitModule1 from "./errorLog.mjs";
const { escapeDiscordLinkTarget, escapeDiscordMarkdown } = __knitModule0;
const { appendErrorLog } = __knitModule1;
const COMMIT_DESCRIPTION_LIMIT = 1800;
function createPushDescription({ post, logOutput, hasError }) {
  const branch = escapeDiscordMarkdown(post.ref?.replace(/^refs\/heads\//, "") || "unknown");
  let description = `Branch: **${branch}** - Commits: **${post.commits.length}**\n`;
  for (const commit of post.commits) {
    const id = escapeDiscordMarkdown(commit.id?.substring(0, 7) || "");
    const message = escapeDiscordMarkdown(commit.message || "").trim();
    const url = escapeDiscordLinkTarget(commit.url || "");
    description += `**${id}**: [${message}](${url})\n`;
  }
  if (description.length > COMMIT_DESCRIPTION_LIMIT)
    description = `${description.slice(0, COMMIT_DESCRIPTION_LIMIT - 3)}...`;
  if (hasError && logOutput) description = appendErrorLog(description, logOutput);
  return description.trim();
}
export default createPushDescription;
Object.assign(createPushDescription, {
  createPushDescription,
});
