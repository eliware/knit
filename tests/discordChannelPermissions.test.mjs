import { jest } from "@jest/globals";
import { syncChannelPermissions } from "../src/discordChannelPermissions.mjs";

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
