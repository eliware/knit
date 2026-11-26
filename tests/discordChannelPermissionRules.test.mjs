import __knitModule0 from "../src/discordChannelPermissionRules.mjs";
const { createChannelPermissionOverwrites } = __knitModule0;
test("builds public and private announcement permissions", () => {
  expect(createChannelPermissionOverwrites("everyone", false)).toEqual([
    {
      id: "everyone",
      allow: ["ViewChannel"],
      deny: [
        "SendMessages",
        "SendMessagesInThreads",
        "CreatePublicThreads",
        "CreatePrivateThreads",
      ],
    },
  ]);
  expect(createChannelPermissionOverwrites("everyone", true)[0]).toEqual({
    id: "everyone",
    allow: [],
    deny: [
      "SendMessages",
      "SendMessagesInThreads",
      "CreatePublicThreads",
      "CreatePrivateThreads",
      "ViewChannel",
    ],
  });
});
