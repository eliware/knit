import { log as logger } from "@eliware/common";
import __knitModule0 from "./discordChannelPermissionRules.mjs";
const { createChannelPermissionOverwrites } = __knitModule0;
const GUILD_ANNOUNCEMENT = 5;
async function createAnnouncementChannel({
  guild,
  name,
  privateRepository,
  repository,
  log = logger,
}) {
  const channel = await guild.channels.create({
    name,
    type: GUILD_ANNOUNCEMENT,
    permissionOverwrites: createChannelPermissionOverwrites(
      guild.roles.everyone.id,
      privateRepository,
    ),
  });
  log.info?.("[Discord] Created repository channel", {
    repository,
    private: privateRepository,
  });
  return channel;
}
export default createAnnouncementChannel;
Object.assign(createAnnouncementChannel, {
  GUILD_ANNOUNCEMENT,
  createAnnouncementChannel,
});
