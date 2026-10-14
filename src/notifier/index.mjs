import { log as logger } from "@eliware/common";
import { prepareNotificationMessage } from "./message.mjs";
import { getNotifierState } from "./state.mjs";
import { deliverDiscordMessage } from "./delivery.mjs";
export { clearDiscordClient, setChannelResolver, setDiscordClient } from "./state.mjs";
export {
  tail,
  limitEmbed,
  DISCORD_EMBED_DESCRIPTION_LIMIT,
  DISCORD_EMBED_TOTAL_LIMIT,
  DISCORD_EMBED_FIELD_VALUE_LIMIT,
} from "./embedLimits.mjs";
export { createEmbed } from "./embeds.mjs";
/**
 * Sends a notification to a Discord channel.
 * @param {Object} params
 * @param {string} params.channelId - The Discord channel snowflake.
 * @param {Object} params.post - The webhook payload.
 * @param {string} params.log - The log output.
 * @param {boolean} params.hasError - Whether an error occurred.
 * @param {string} [params.event] - GitHub event name.
 * @param {Object} [params.embed] - Optional pre-built embed.
 * @param {Object} [params.discordClient] - Optional Discord client for testing/injection.
 */
export async function send({
  channelId,
  post = {},
  event = "push",
  embed: providedEmbed,
  logOutput,
  hasError,
  packageJson,
  log = logger,
  discordClient,
}) {
  const state = getNotifierState();
  discordClient ??= state.discordClient;
  const resolveRepositoryChannel = state.resolveRepositoryChannel;
  if (!channelId && resolveRepositoryChannel)
    channelId = await resolveRepositoryChannel({
      repository: post.repository?.full_name,
      privateRepository: post.repository?.private === true,
      packageJson,
    });
  if (!channelId) return;
  if (!discordClient) throw new Error("Discord client is not connected");
  const embed = await prepareNotificationMessage({
    providedEmbed,
    post,
    event,
    logOutput,
    hasError,
  });
  await deliverDiscordMessage({ discordClient, channelId, embed, post, event, log });
}
