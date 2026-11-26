import { jest } from "@jest/globals";
import __knitModule0 from "../src/discordChannelPermissions.mjs";
const { syncChannelPermissions } = __knitModule0;
test("synchronizes private and public channel access rules", async () => {
  const edit = jest.fn();
  await syncChannelPermissions(
    {
      permissionOverwrites: {
        edit,
      },
    },
    {
      roles: {
        everyone: {
          id: "everyone",
        },
      },
    },
    true,
  );
  expect(edit).toHaveBeenCalledWith("everyone", {
    ViewChannel: false,
    SendMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });
  await syncChannelPermissions(
    {
      permissionOverwrites: {
        edit,
      },
    },
    {
      roles: {
        everyone: {
          id: "everyone",
        },
      },
    },
    false,
  );
  expect(edit).toHaveBeenLastCalledWith("everyone", {
    ViewChannel: true,
    SendMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });
});
test("fails when Knit cannot change the channel permissions", async () => {
  await expect(
    syncChannelPermissions(
      {},
      {
        roles: {
          everyone: {
            id: "everyone",
          },
        },
      },
      false,
    ),
  ).rejects.toThrow("Repository channel permissions cannot be synchronized");
  await expect(
    syncChannelPermissions(
      {
        permissionOverwrites: {
          edit: jest.fn(),
        },
      },
      {},
      false,
    ),
  ).rejects.toThrow("Repository channel permissions cannot be synchronized");
});
