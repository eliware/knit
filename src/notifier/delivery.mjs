export async function deliverDiscordMessage({ discordClient, channelId, embed, post, event, log }) {
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
