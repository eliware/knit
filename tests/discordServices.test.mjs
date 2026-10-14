import { jest } from "@jest/globals";
import { registerDiscordServices, unregisterDiscordServices } from "../src/discordServices.mjs";

test("registers presence and notification services", () => {
  const client = {};
  const presenceManager = { start: jest.fn() };
  const createdResolver = jest.fn();
  const createChannelResolverFn = jest.fn(() => createdResolver);
  const createPresenceManagerFn = jest.fn(() => presenceManager);
  const setPresenceManagerFn = jest.fn();
  const NotifierMod = { setDiscordClient: jest.fn(), setChannelResolver: jest.fn() };
  const targetLoader = { load: jest.fn(() => ({ guildId: "loaded-guild" })) };
  const log = { info: jest.fn() };

  expect(
    registerDiscordServices({
      client,
      targetLoader,
      log,
      NotifierMod,
      createChannelResolverFn,
      createPresenceManagerFn,
      setPresenceManagerFn,
    }),
  ).toBe(presenceManager);
  expect(createPresenceManagerFn).toHaveBeenCalledWith(
    expect.objectContaining({ client, version: expect.any(String), log }),
  );
  expect(setPresenceManagerFn).toHaveBeenCalledWith(presenceManager);
  expect(presenceManager.start).toHaveBeenCalled();
  expect(NotifierMod.setDiscordClient).toHaveBeenCalledWith(client);
  expect(createChannelResolverFn).toHaveBeenCalledWith({
    client,
    guildId: "loaded-guild",
    log,
  });
  expect(NotifierMod.setChannelResolver).toHaveBeenCalledWith(createdResolver);
});

test("uses the supplied guild ID and unregisters services", () => {
  const client = {};
  const manager = { start: jest.fn() };
  const createChannelResolverFn = jest.fn();
  const targetLoader = { load: jest.fn() };
  const setPresenceManagerFn = jest.fn();
  const NotifierMod = {
    setDiscordClient: jest.fn(),
    setChannelResolver: jest.fn(),
    clearDiscordClient: jest.fn(),
  };
  registerDiscordServices({
    client,
    guildId: "provided-guild",
    targetLoader,
    NotifierMod,
    createChannelResolverFn,
    createPresenceManagerFn: () => manager,
    setPresenceManagerFn,
  });
  expect(targetLoader.load).not.toHaveBeenCalled();
  expect(createChannelResolverFn).toHaveBeenCalledWith(
    expect.objectContaining({ guildId: "provided-guild" }),
  );

  unregisterDiscordServices({ client, NotifierMod, setPresenceManagerFn });
  expect(setPresenceManagerFn).toHaveBeenLastCalledWith(null);
  expect(NotifierMod.clearDiscordClient).toHaveBeenCalledWith(client);
});
