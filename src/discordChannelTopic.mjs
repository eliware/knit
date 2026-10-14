import { channelTopic } from "./discordChannelTopicMetadata.mjs";

export async function syncChannelTopic(channel, packageJson) {
  const topic = channelTopic(packageJson);
  if (topic && typeof channel.edit === "function" && channel.topic !== topic)
    await channel.edit({ topic });
}
