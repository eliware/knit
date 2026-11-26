import { log as logger } from "@eliware/common";
import createChannelIdentity from "./discord/channel/identity.mjs";
import __knitModule1 from "./discordChannelProvisioning.mjs";
import __knitModule2 from "./discord/channel-metadata.mjs";
const { provisionAnnouncementChannel } = __knitModule1;
const { syncChannelMetadata } = __knitModule2;
function createChannelResolver({ client, guildId, log = logger } = {}) {
  if (!client || !guildId) throw new Error("Discord client and guild ID are required");
  return async function resolveChannel({
    repository,
    privateRepository = false,
    packageJson,
  } = {}) {
    const name = createChannelIdentity(repository);
    const guild = await client.guilds.fetch(guildId);
    const channel = await provisionAnnouncementChannel({
      guild,
      name,
      privateRepository,
      repository,
      log,
    });
    await syncChannelMetadata({ channel, guild, privateRepository, packageJson });
    return channel.id;
  };
}
export default createChannelResolver;
Object.assign(createChannelResolver, {
  createChannelResolver,
});
