import { createChannelPermissionOverwrites } from "./discordChannelPermissionRules.mjs";

const GUILD_ANNOUNCEMENT = 5;

export async function createAnnouncementChannel({
  guild,
  name,
  privateRepository,
  repository,
  log = console,
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
