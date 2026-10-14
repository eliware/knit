import { channelName, channelTopic } from "./discordChannelMetadata.mjs";
import { syncChannelPermissions } from "./discordChannelPermissions.mjs";
import { provisionAnnouncementChannel } from "./discordChannelProvisioning.mjs";
export { channelName } from "./discordChannelMetadata.mjs";

export function createChannelResolver({ client, guildId, log = console } = {}) {
  if (!client || !guildId) throw new Error("Discord client and guild ID are required");
  const cache = new Map();
  return async function resolveChannel({
    repository,
    privateRepository = false,
    packageJson,
  } = {}) {
    const name = channelName(repository);
    let channel = cache.get(repository);
    const guild = await client.guilds.fetch(guildId);
    if (!channel) {
      channel = await provisionAnnouncementChannel({
        guild,
        name,
        privateRepository,
        repository,
        log,
      });
    }
    await syncChannelPermissions(channel, guild, privateRepository);
    const topic = channelTopic(packageJson);
    if (topic && typeof channel.edit === "function" && channel.topic !== topic)
      await channel.edit({ topic });
    cache.set(repository, channel);
    return channel.id;
  };
}
