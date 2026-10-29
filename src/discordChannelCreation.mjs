import { log as logger } from "@eliware/common";
import { createChannelPermissionOverwrites } from "./discordChannelPermissionRules.mjs";
import { GUILD_ANNOUNCEMENT } from "./discordChannelTypes.mjs";

export async function createAnnouncementChannel({
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
  log.info?.("[Discord] Created repository channel", { repository, private: privateRepository });
  return channel;
}
