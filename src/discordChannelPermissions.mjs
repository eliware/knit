export async function syncChannelPermissions(channel, guild, privateRepository) {
  if (channel.permissionOverwrites?.edit && guild.roles?.everyone?.id) {
    await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
      ViewChannel: !privateRepository,
      SendMessages: false,
      SendMessagesInThreads: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
    });
  }
}
