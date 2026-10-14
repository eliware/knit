import { DISCORD_EMBED_DESCRIPTION_LIMIT, tail } from "./embedLimits.mjs";
import { escapeDiscordCode } from "./discordMarkdown.mjs";

const ERROR_LOG_WRAPPER_LENGTH = 12;

export function renderErrorLog(logOutput, available) {
  return `\`\`\`text\n${escapeDiscordCode(tail(logOutput, available))}\n\`\`\``;
}

export function appendErrorLog(description, logOutput) {
  const available = Math.max(
    0,
    DISCORD_EMBED_DESCRIPTION_LIMIT - description.length - ERROR_LOG_WRAPPER_LENGTH,
  );
  return `${description}${renderErrorLog(logOutput, available)}`;
}
