import { limitEmbed } from "./embedLimits.mjs";
import { createEmbed } from "./embeds.mjs";
import { applyMessageStatus } from "./messageStatus.mjs";

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
  return limitEmbed(applyMessageStatus(embed, hasError));
}
