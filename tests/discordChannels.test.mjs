import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
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

test("reuses a matching text channel and caches it", async () => {
  const existing = {
    id: "channel-1",
    name: "app",
    type: 5,
    permissionOverwrites: { edit: jest.fn() },
  };
  const { client, guild } = clientWith([existing]);
  const resolve = createChannelResolver({ client, guildId: "guild" });
  await expect(resolve({ repository: "eliware/app" })).resolves.toBe("channel-1");
  await expect(resolve({ repository: "eliware/app" })).resolves.toBe("channel-1");
  expect(guild.channels.fetch).toHaveBeenCalledTimes(1);
  expect(existing.permissionOverwrites.edit).toHaveBeenCalled();
});

test("creates public and private repository channels", async () => {
  const publicClient = clientWith();
  await expect(
    createChannelResolver({ client: publicClient.client, guildId: "guild" })({
      repository: "eliware/public",
      packageJson: { description: "Public app", keywords: ["web"] },
    }),
  ).resolves.toBe("new-0");
  expect(publicClient.created[0].channel.edit).toHaveBeenCalledWith({
    topic: "Public app\nKeywords: web",
  });
  expect(publicClient.created[0].options.type).toBe(5);
  expect(publicClient.created[0].options.permissionOverwrites).toHaveLength(1);
  const privateClient = clientWith();
  await createChannelResolver({ client: privateClient.client, guildId: "guild" })({
    repository: "eliware/private",
    privateRepository: true,
  });
  expect(privateClient.created[0].options.permissionOverwrites).toHaveLength(1);
  expect(privateClient.created[0].channel.permissionOverwrites.edit).toHaveBeenCalled();
});

test("normalizes repository names for Discord", async () => {
  const { client, created } = clientWith();
  await createChannelResolver({ client, guildId: "guild" })({ repository: "eliware/eliware.org" });
  expect(created[0].options.name).toBe("eliware-org");
});

test("synchronizes a channel without overwrite support", async () => {
  const { client } = clientWith([{ id: "channel", name: "plain", type: 5 }]);
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
  const { client } = clientWith([{ name: "app", type: 5 }]);
  const resolve = createChannelResolver({ client, guildId: "guild" });
  await expect(resolve({ repository: "eliware/app" })).resolves.toBeUndefined();
  await expect(resolve()).rejects.toThrow("Repository is required");
});
