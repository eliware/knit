import { tail } from "./embedLimits.mjs";
import { escapeDiscordCode } from "./discordMarkdown.mjs";

export function renderErrorLog(logOutput, available) {
  return `\`\`\`text\n${escapeDiscordCode(tail(logOutput, available))}\n\`\`\``;
}
