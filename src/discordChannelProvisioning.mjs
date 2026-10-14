import { createChannelPermissionOverwrites } from "./discordChannelPermissions.mjs";

const GUILD_ANNOUNCEMENT = 5;

export async function provisionAnnouncementChannel({
  guild,
  name,
  privateRepository,
  repository,
  log = console,
}) {
  const channels = await guild.channels.fetch();
  const existing = channels.find(
    (channel) => channel?.name === name && channel?.type === GUILD_ANNOUNCEMENT,
  );
  if (existing) return existing;

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
