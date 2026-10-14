import { jest } from "@jest/globals";
import { createAnnouncementChannel } from "../src/discordChannelCreation.mjs";

test("creates a private announcement channel and records its repository", async () => {
  const channel = { id: "new" };
  const create = jest.fn().mockResolvedValue(channel);
  const guild = { roles: { everyone: { id: "everyone" } }, channels: { create } };
  const log = { info: jest.fn() };

  await expect(
    createAnnouncementChannel({
      guild,
      name: "app",
      privateRepository: true,
      repository: "eliware/app",
      log,
    }),
  ).resolves.toBe(channel);
  expect(create).toHaveBeenCalledWith({
    name: "app",
    type: 5,
    permissionOverwrites: [
      {
        id: "everyone",
        allow: [],
        deny: [
          "SendMessages",
          "SendMessagesInThreads",
          "CreatePublicThreads",
          "CreatePrivateThreads",
          "ViewChannel",
        ],
      },
    ],
  });
  expect(log.info).toHaveBeenCalledWith("[Discord] Created repository channel", {
    repository: "eliware/app",
    private: true,
  });
});

test("uses the console logger when no logger is supplied", async () => {
  const info = jest.spyOn(console, "info").mockImplementation(() => {});
  const guild = {
    roles: { everyone: { id: "everyone" } },
    channels: { create: jest.fn().mockResolvedValue({ id: "new" }) },
  };
  await createAnnouncementChannel({
    guild,
    name: "app",
    privateRepository: false,
    repository: "eliware/app",
  });
  expect(info).toHaveBeenCalledWith("[Discord] Created repository channel", {
    repository: "eliware/app",
    private: false,
  });
  info.mockRestore();
});
