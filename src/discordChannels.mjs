import { channelName } from "./discordChannelMetadata.mjs";
import { syncChannelPermissions } from "./discordChannelPermissions.mjs";
import { provisionAnnouncementChannel } from "./discordChannelProvisioning.mjs";
import { syncChannelTopic } from "./discordChannelTopic.mjs";
export { channelName } from "./discordChannelMetadata.mjs";

export function createChannelResolver({ client, guildId, log = console } = {}) {
  if (!client || !guildId) throw new Error("Discord client and guild ID are required");
  return async function resolveChannel({
    repository,
    privateRepository = false,
    packageJson,
  } = {}) {
    const name = channelName(repository);
    const guild = await client.guilds.fetch(guildId);
    const channel = await provisionAnnouncementChannel({
      guild,
      name,
      privateRepository,
      repository,
      log,
    });
    await syncChannelPermissions(channel, guild, privateRepository);
    await syncChannelTopic(channel, packageJson);
    return channel.id;
  };
}
