import { jest } from "@jest/globals";
import {
  createChannelPermissionOverwrites,
  syncChannelPermissions,
} from "../src/discordChannelPermissions.mjs";

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

test("synchronizes supported channel access rules", async () => {
  const edit = jest.fn();
  await syncChannelPermissions(
    { permissionOverwrites: { edit } },
    { roles: { everyone: { id: "everyone" } } },
    true,
  );
  expect(edit).toHaveBeenCalledWith("everyone", {
    ViewChannel: false,
    SendMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });
  await syncChannelPermissions({}, {}, false);
  expect(edit).toHaveBeenCalledTimes(1);
});
