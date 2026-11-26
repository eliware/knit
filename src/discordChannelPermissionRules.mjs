function createChannelPermissionOverwrites(everyoneId, privateRepository) {
  return [
    {
      id: everyoneId,
      allow: privateRepository ? [] : ["ViewChannel"],
      deny: [
        "SendMessages",
        "SendMessagesInThreads",
        "CreatePublicThreads",
        "CreatePrivateThreads",
        ...(privateRepository ? ["ViewChannel"] : []),
      ],
    },
  ];
}
export default createChannelPermissionOverwrites;
Object.assign(createChannelPermissionOverwrites, {
  createChannelPermissionOverwrites,
});
