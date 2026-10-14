import { log as logger } from "@eliware/common";
import { limitEmbed } from "./embedLimits.mjs";
import { createEmbed } from "./embeds.mjs";
export {
  tail,
  limitEmbed,
  DISCORD_EMBED_DESCRIPTION_LIMIT,
  DISCORD_EMBED_TOTAL_LIMIT,
  DISCORD_EMBED_FIELD_VALUE_LIMIT,
} from "./embedLimits.mjs";
export { createEmbed } from "./embeds.mjs";
let sharedDiscordClient;
let resolveRepositoryChannel;

export function setDiscordClient(client) {
  sharedDiscordClient = client;
}

export function setChannelResolver(resolver) {
  resolveRepositoryChannel = resolver;
}

export function clearDiscordClient(client) {
  if (!client || sharedDiscordClient === client) {
    sharedDiscordClient = undefined;
    resolveRepositoryChannel = undefined;
  }
}

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
  discordClient = sharedDiscordClient,
}) {
  if (!channelId && resolveRepositoryChannel)
    channelId = await resolveRepositoryChannel({
      repository: post.repository?.full_name,
      privateRepository: post.repository?.private === true,
      packageJson,
    });
  if (!channelId) return;
  if (!discordClient) throw new Error("Discord client is not connected");
  const embed = providedEmbed
    ? { ...providedEmbed, fields: providedEmbed.fields?.map((field) => ({ ...field })) }
    : await createEmbed({ post, event, logOutput, hasError });
  if (hasError) {
    embed.color = 0xff0000;
    embed.title = `\u274c Error: ${embed.title}`;
  } else {
    embed.title = `\u2705 ${embed.title}`;
  }
  limitEmbed(embed);
  log.info("[Notifier] Sending message to Discord channel", { channelId });
  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || typeof channel.send !== "function")
      throw new Error(`Discord channel is not sendable: ${channelId}`);
    const message = await channel.send({ embeds: [embed] });
    if (post.ref?.startsWith("refs/tags/v") && typeof message?.crosspost === "function") {
      await message.crosspost();
      log.info("[Notifier] Cross-posted release announcement", {
        channelId,
        tag: post.ref.slice("refs/tags/".length),
      });
    }
  } catch (error) {
    log.error?.("[Notifier] Discord channel send failed", {
      error,
      event,
      channelId,
      repository: post.repository?.full_name,
    });
    throw error;
  }
}
