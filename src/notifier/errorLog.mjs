import __knitModule0 from "./embedLimits.mjs";
import __knitModule1 from "./discordMarkdown.mjs";
import textLimit from "./text-limit.mjs";
const { DISCORD_EMBED_DESCRIPTION_LIMIT } = __knitModule0;
const { escapeDiscordCode } = __knitModule1;
const ERROR_LOG_WRAPPER_LENGTH = 12;
function renderErrorLog(logOutput, available) {
  return `\`\`\`text\n${escapeDiscordCode(textLimit(logOutput, available))}\n\`\`\``;
}
function appendErrorLog(description, logOutput) {
  const available = Math.max(
    0,
    DISCORD_EMBED_DESCRIPTION_LIMIT - description.length - ERROR_LOG_WRAPPER_LENGTH,
  );
  return `${description}${renderErrorLog(logOutput, available)}`;
}
export default renderErrorLog;
Object.assign(renderErrorLog, {
  renderErrorLog,
  appendErrorLog,
});
