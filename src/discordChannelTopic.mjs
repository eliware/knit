import __knitModule0 from "./discordChannelTopicMetadata.mjs";
const { channelTopic } = __knitModule0;
async function syncChannelTopic(channel, packageJson) {
  if (packageJson == null) return;
  const topic = channelTopic(packageJson);
  if (typeof channel.edit === "function" && channel.topic !== topic && (topic || channel.topic))
    await channel.edit({
      topic,
    });
}
export default syncChannelTopic;
Object.assign(syncChannelTopic, {
  syncChannelTopic,
});
