import { channelTopic } from "./discordChannelTopicMetadata.mjs";

export async function syncChannelTopic(channel, packageJson) {
  const topic = channelTopic(packageJson);
  if (typeof channel.edit === "function" && channel.topic !== topic && (topic || channel.topic))
    await channel.edit({ topic });
}
