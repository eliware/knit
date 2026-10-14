export function createChannelPermissionOverwrites(everyoneId, privateRepository) {
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
