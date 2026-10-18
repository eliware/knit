import { log as logger } from "@eliware/common";
import { prepareNotificationMessage } from "./message.mjs";
import { getNotifierState } from "./state.mjs";
import { deliverDiscordMessage } from "./delivery.mjs";

/**
 * Send a notification to a Discord channel.
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
