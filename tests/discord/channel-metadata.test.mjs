import { jest } from "@jest/globals";
import __knitModule0 from "../../src/discord/channel-metadata.mjs";
const { syncChannelMetadata } = __knitModule0;

test("synchronizes channel permissions and repository topic", async () => {
  const channel = {
    topic: "old topic",
    edit: jest.fn(),
    permissionOverwrites: { edit: jest.fn() },
  };
  const guild = { roles: { everyone: { id: "everyone" } } };
  const packageJson = { description: "App" };

  await syncChannelMetadata({ channel, guild, privateRepository: true, packageJson });

  expect(channel.permissionOverwrites.edit).toHaveBeenCalledWith(
    "everyone",
    expect.objectContaining({ ViewChannel: false }),
  );
  expect(channel.edit).toHaveBeenCalledWith({ topic: expect.stringContaining("App") });
});
