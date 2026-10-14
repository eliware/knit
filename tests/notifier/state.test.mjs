import {
  clearDiscordClient,
  getNotifierState,
  setChannelResolver,
  setDiscordClient,
} from "../../src/notifier/state.mjs";

test("stores and clears the Discord client and channel resolver", () => {
  const client = {};
  const otherClient = {};
  const resolver = () => "channel";
  setDiscordClient(client);
  setChannelResolver(resolver);
  expect(getNotifierState()).toEqual({ discordClient: client, resolveRepositoryChannel: resolver });
  clearDiscordClient(otherClient);
  expect(getNotifierState()).toEqual({ discordClient: client, resolveRepositoryChannel: resolver });
  clearDiscordClient(client);
  expect(getNotifierState()).toEqual({
    discordClient: undefined,
    resolveRepositoryChannel: undefined,
  });
  clearDiscordClient();
});

test("clears only the registered Discord client", () => {
  const client = {};
  const otherClient = {};
  setDiscordClient(client);
  setChannelResolver(() => "channel");
  clearDiscordClient(otherClient);
  expect(getNotifierState().discordClient).toBe(client);
  clearDiscordClient(client);
  expect(getNotifierState().discordClient).toBeUndefined();
});
