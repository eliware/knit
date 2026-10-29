import { log as logger } from "@eliware/common";
import { createAnnouncementChannel } from "./discordChannelCreation.mjs";
import { GUILD_ANNOUNCEMENT } from "./discordChannelTypes.mjs";

export async function provisionAnnouncementChannel({
  guild,
  name,
  privateRepository,
  repository,
  log = logger,
}) {
  const channels = await guild.channels.fetch();
  const existing = channels.find(
    (channel) => channel?.name === name && channel?.type === GUILD_ANNOUNCEMENT,
  );
  if (existing) return existing;

  return createAnnouncementChannel({ guild, name, privateRepository, repository, log });
}
