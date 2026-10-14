import { channelName, channelTopic } from "./discordChannelMetadata.mjs";
import {
  createChannelPermissionOverwrites,
  syncChannelPermissions,
} from "./discordChannelPermissions.mjs";
export { channelName } from "./discordChannelMetadata.mjs";

const GUILD_ANNOUNCEMENT = 5;

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
      const channels = await guild.channels.fetch();
      channel = channels.find(
        (candidate) => candidate?.name === name && candidate?.type === GUILD_ANNOUNCEMENT,
      );
      if (!channel) {
        const options = {
          name,
          type: GUILD_ANNOUNCEMENT,
          permissionOverwrites: createChannelPermissionOverwrites(
            guild.roles.everyone.id,
            privateRepository,
          ),
        };
        channel = await guild.channels.create(options);
        log.info?.("[Discord] Created repository channel", {
          repository,
          private: privateRepository,
        });
      }
    }
    await syncChannelPermissions(channel, guild, privateRepository);
    const topic = channelTopic(packageJson);
    if (topic && typeof channel.edit === "function" && channel.topic !== topic)
      await channel.edit({ topic });
    cache.set(repository, channel);
    return channel.id;
  };
}
