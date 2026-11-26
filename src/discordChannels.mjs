import { log as logger } from "@eliware/common";
import __knitModule0 from "./discordChannelName.mjs";
import __knitModule1 from "./discordChannelPermissions.mjs";
import __knitModule2 from "./discordChannelProvisioning.mjs";
import __knitModule3 from "./discordChannelTopic.mjs";
const { channelName } = __knitModule0;
const { syncChannelPermissions } = __knitModule1;
const { provisionAnnouncementChannel } = __knitModule2;
const { syncChannelTopic } = __knitModule3;
function createChannelResolver({ client, guildId, log = logger } = {}) {
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
export default createChannelResolver;
Object.assign(createChannelResolver, {
  createChannelResolver,
});
