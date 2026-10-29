export async function syncChannelPermissions(channel, guild, privateRepository) {
  if (!channel.permissionOverwrites?.edit || !guild.roles?.everyone?.id)
    throw new Error("Repository channel permissions cannot be synchronized");
  await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
    ViewChannel: !privateRepository,
    SendMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });
}
