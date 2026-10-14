import { createChannelPermissionOverwrites } from "../src/discordChannelPermissionRules.mjs";

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
