import { jest } from "@jest/globals";
const channelId = "123456789012345678";
const makeClient = (send) => ({ channels: { fetch: jest.fn().mockResolvedValue({ send }) } });

import * as notifier from "../../src/notifier/send.mjs";
import * as notifierState from "../../src/notifier/state.mjs";
const log = { info: jest.fn(), error: jest.fn() };
beforeEach(() => jest.clearAllMocks());

it("should not send if channelId is missing", async () => {
  const sendMessageFn = jest.fn();
  await notifier.send({
    channelId: "",
    post: {},
    logOutput: "",
    hasError: false,
    log,
    discordClient: makeClient(sendMessageFn),
  });
  expect(sendMessageFn).not.toHaveBeenCalled();
});

it("should reject when the shared Discord client is not connected", async () => {
  notifierState.clearDiscordClient();
  await expect(notifier.send({ channelId, post: {} })).rejects.toThrow(
    "Discord client is not connected",
  );
});

it("resolves a repository channel when no channel ID is supplied", async () => {
  const channel = { send: jest.fn().mockResolvedValue(undefined) };
  const client = { channels: { fetch: jest.fn().mockResolvedValue(channel) } };
  notifierState.setChannelResolver(jest.fn().mockResolvedValue(channelId));
  await notifier.send({
    post: { repository: { full_name: "foo/bar" } },
    log,
    discordClient: client,
  });
  expect(client.channels.fetch).toHaveBeenCalledWith(channelId);
  notifierState.clearDiscordClient();
});

it("sends generated and provided embeds with their status", async () => {
  const embed = { title: "Deployment" };
  const log = { info: jest.fn(), error: jest.fn() };
  const sendMessageFn = jest.fn();
  const discordClient = makeClient(sendMessageFn);
  await notifier.send({ channelId, post: {}, hasError: false, log, discordClient });
  expect(sendMessageFn).toHaveBeenLastCalledWith({
    embeds: [expect.objectContaining({ title: "✅ Unknown Repository - Event" })],
  });
  await notifier.send({
    channelId,
    post: {
      ref: "refs/tags/v1.0.0",
      repository: { full_name: "foo/bar", html_url: "url" },
      pusher: { name: "bob" },
    },
    logOutput: "",
    hasError: true,
    log,
    discordClient,
  });
  expect(sendMessageFn).toHaveBeenLastCalledWith({
    embeds: [expect.objectContaining({ title: "❌ Error: bar v1.0.0 has been released! 🎉" })],
  });
  await notifier.send({ channelId, post: {}, embed, hasError: false, log, discordClient });
  expect(log.info).toHaveBeenCalledWith("[Notifier] Sending message to Discord channel", {
    channelId,
  });
  expect(sendMessageFn).toHaveBeenLastCalledWith({ embeds: [{ title: "✅ Deployment" }] });
  await notifier.send({
    channelId,
    post: {},
    embed,
    hasError: true,
    log,
    discordClient,
  });
  expect(embed).toEqual({ title: "Deployment" });
  expect(sendMessageFn).toHaveBeenLastCalledWith({
    embeds: [expect.objectContaining({ title: "❌ Error: Deployment", color: 0xff0000 })],
  });
});

it("covers send parameter defaults on an early return", async () => {
  await notifier.send({ channelId: "", post: {} });
});

it("returns when no channel is configured", async () => {
  await expect(notifier.send({})).resolves.toBeUndefined();
});
