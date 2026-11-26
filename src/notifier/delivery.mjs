import __knitModule0 from "./releaseCrosspost.mjs";
const { crosspostReleaseAnnouncement } = __knitModule0;
async function deliverDiscordMessage({ discordClient, channelId, embed, post, event, log }) {
  log.info("[Notifier] Sending message to Discord channel", {
    channelId,
  });
  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || typeof channel.send !== "function")
      throw new Error(`Discord channel is not sendable: ${channelId}`);
    const message = await channel.send({
      embeds: [embed],
    });
    await crosspostReleaseAnnouncement({
      message,
      post,
      channelId,
      log,
    });
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
export default deliverDiscordMessage;
Object.assign(deliverDiscordMessage, {
  deliverDiscordMessage,
});
