import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { channelName } from "../src/discordChannelName.mjs";
import { createChannelResolver } from "../src/discordChannels.mjs";

function clientWith(channels = []) {
  const created = [];
  const create = jest.fn(async (options) => {
    const channel = {
      id: `new-${created.length}`,
      edit: jest.fn(),
      topic: undefined,
      permissionOverwrites: { edit: jest.fn() },
    };
    created.push({ channel, options });
    return channel;
  });
  const guild = {
    roles: { everyone: { id: "everyone" } },
    channels: { fetch: jest.fn().mockResolvedValue({ find: (fn) => channels.find(fn) }), create },
  };
  return { client: { guilds: { fetch: jest.fn().mockResolvedValue(guild) } }, guild, created };
}

test("checks the guild channel list and reuses the repo channel on each event", async () => {
  const existing = {
    id: "channel-1",
    name: channelName("eliware/app"),
    type: 5,
    edit: jest.fn(),
    permissionOverwrites: { edit: jest.fn() },
  };
  const { client, guild } = clientWith([existing]);
  const resolve = createChannelResolver({ client, guildId: "guild" });
  const event = {
    repository: "eliware/app",
    privateRepository: true,
    packageJson: { description: "Private app" },
  };
  await expect(resolve(event)).resolves.toBe("channel-1");
  await expect(resolve(event)).resolves.toBe("channel-1");
  expect(guild.channels.fetch).toHaveBeenCalledTimes(2);
  expect(existing.permissionOverwrites.edit).toHaveBeenCalled();
  expect(existing.edit).toHaveBeenCalled();
});

test("creates public and private repository channels", async () => {
  const publicClient = clientWith();
  await expect(
    createChannelResolver({ client: publicClient.client, guildId: "guild" })({
      repository: "eliware/public",
      packageJson: { description: "Public app", keywords: ["web"] },
    }),
  ).resolves.toBe("new-0");
  expect(publicClient.created).toHaveLength(1);
  const privateClient = clientWith();
  await createChannelResolver({ client: privateClient.client, guildId: "guild" })({
    repository: "eliware/private",
    privateRepository: true,
  });
  expect(privateClient.created).toHaveLength(1);
});

test("creates a channel with the repository name and no hash suffix", async () => {
  const { client, created } = clientWith();
  await createChannelResolver({ client, guildId: "guild" })({ repository: "eliware/eliware.org" });
  expect(created[0].options.name).toBe("eliware-org");
  expect(created[0].options.name).not.toMatch(/-[a-f0-9]{12}$/u);
});

test("synchronizes a channel without overwrite support", async () => {
  const { client } = clientWith([{ id: "channel", name: channelName("eliware/plain"), type: 5 }]);
  await expect(
    createChannelResolver({ client, guildId: "guild" })({ repository: "eliware/plain" }),
  ).resolves.toBe("channel");
});

test("requires a valid repository and Discord client", () => {
  expect(() => createChannelResolver()).toThrow();
  const { client } = clientWith();
  const resolve = createChannelResolver({ client, guildId: "guild" });
  return expect(resolve({ repository: "invalid" })).rejects.toThrow();
});
test("uses default channel resolver options", async () => {
  const { client } = clientWith([{ name: channelName("eliware/app"), type: 5 }]);
  const resolve = createChannelResolver({ client, guildId: "guild" });
  await expect(resolve({ repository: "eliware/app" })).resolves.toBeUndefined();
  await expect(resolve()).rejects.toThrow("Repository is required");
});
