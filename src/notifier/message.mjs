import { limitEmbed } from "./embedLimits.mjs";
import { createEmbed } from "./embeds.mjs";

export async function prepareNotificationMessage({
  providedEmbed,
  post,
  event,
  logOutput,
  hasError,
}) {
  const embed = providedEmbed
    ? { ...providedEmbed, fields: providedEmbed.fields?.map((field) => ({ ...field })) }
    : await createEmbed({ post, event, logOutput, hasError });
  if (hasError) {
    embed.color = 0xff0000;
    embed.title = `\u274c Error: ${embed.title}`;
  } else {
    embed.title = `\u2705 ${embed.title}`;
  }
  return limitEmbed(embed);
}
