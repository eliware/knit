import { jest } from "@jest/globals";
const channelId = "123456789012345678";
const makeClient = (send) => ({ channels: { fetch: jest.fn().mockResolvedValue({ send }) } });

import * as notifier from "../../src/notifier/index.mjs";
const log = { info: jest.fn(), error: jest.fn() };
beforeEach(() => jest.clearAllMocks());

beforeEach(() => {
  jest.clearAllMocks();
});

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
  notifier.clearDiscordClient();
  await expect(notifier.send({ channelId, post: {} })).rejects.toThrow(
    "Discord client is not connected",
  );
});

it("should send error embed if hasError is true", async () => {
  const post = {
    ref: "refs/tags/v1.0.0",
    repository: { full_name: "foo/bar", html_url: "url" },
    pusher: { name: "bob" },
  };
  const sendMessageFn = jest.fn();
  await notifier.send({
    channelId,
    post,
    logOutput: "",
    hasError: true,
    log,
    discordClient: makeClient(sendMessageFn),
  });
  expect(sendMessageFn).toHaveBeenCalled();
});

it("should send success embed if hasError is false", async () => {
  const post = {
    ref: "refs/tags/v1.0.0",
    repository: { full_name: "foo/bar", html_url: "url" },
    pusher: { name: "bob" },
  };
  const sendMessageFn = jest.fn();
  await notifier.send({
    channelId,
    post,
    logOutput: "",
    hasError: false,
    log,
    discordClient: makeClient(sendMessageFn),
  });
  expect(sendMessageFn).toHaveBeenCalled();
});

it("cross-posts v tag announcements when Discord returns a message", async () => {
  const crosspost = jest.fn().mockResolvedValue(undefined);
  const sendMessageFn = jest.fn().mockResolvedValue({ crosspost });
  await notifier.send({
    channelId,
    post: { ref: "refs/tags/v2.1.1", repository: { full_name: "foo/bar" } },
    log,
    discordClient: makeClient(sendMessageFn),
  });
  expect(crosspost).toHaveBeenCalled();
});

it("resolves a repository channel when no channel ID is supplied", async () => {
  const channel = { send: jest.fn().mockResolvedValue(undefined) };
  const client = { channels: { fetch: jest.fn().mockResolvedValue(channel) } };
  notifier.setChannelResolver(jest.fn().mockResolvedValue(channelId));
  await notifier.send({
    post: { repository: { full_name: "foo/bar" } },
    log,
    discordClient: client,
  });
  expect(client.channels.fetch).toHaveBeenCalledWith(channelId);
  notifier.clearDiscordClient();
});

it("send uses provided embed, defaults event, and sends to the channel", async () => {
  const embed = { title: "Deployment" };
  const log = { info: jest.fn(), error: jest.fn() };
  const sendMessageFn = jest.fn();
  const discordClient = makeClient(sendMessageFn);
  await notifier.send({ channelId, post: {}, embed, hasError: false, log, discordClient });
  expect(log.info).toHaveBeenCalledWith("[Notifier] Sending message to Discord channel", {
    channelId,
  });
  expect(sendMessageFn).toHaveBeenCalledWith({ embeds: [{ title: "✅ Deployment" }] });
});

it("send prefixes provided error embeds and awaits sender", async () => {
  const embed = { title: "Failure" };
  const log = { info: jest.fn(), error: jest.fn() };
  const sendMessageFn = jest.fn(() => Promise.resolve());
  await notifier.send({
    channelId,
    post: {},
    embed,
    hasError: true,
    log,
    discordClient: makeClient(sendMessageFn),
  });
  expect(embed).toEqual({ title: "Failure" });
});

it.each([
  ["a missing channel", undefined],
  ["a non-sendable channel", {}],
])("rejects when Discord returns %s", async (_label, channel) => {
  const log = { info: jest.fn(), error: jest.fn() };
  const discordClient = { channels: { fetch: jest.fn().mockResolvedValue(channel) } };
  await expect(notifier.send({ channelId, post: {}, log, discordClient })).rejects.toThrow(
    `Discord channel is not sendable: ${channelId}`,
  );
  expect(log.error).toHaveBeenCalled();
});

it("covers send parameter defaults on an early return", async () => {
  await notifier.send({ channelId: "", post: {} });
});

it("does not mutate provided embeds", async () => {
  const embed = { title: "Deployment", fields: [{ name: "log", value: "ok" }] };
  const sendMessageFn = jest.fn();
  await notifier.send({
    channelId,
    post: { repository: { full_name: "foo/bar" } },
    embed,
    hasError: false,
    log: { info: jest.fn() },
    discordClient: makeClient(sendMessageFn),
  });
  expect(embed).toEqual({ title: "Deployment", fields: [{ name: "log", value: "ok" }] });
  expect(sendMessageFn).toHaveBeenCalledWith(
    expect.objectContaining({ embeds: expect.any(Array) }),
  );
});

it("logs and rethrows Discord send failures with context", async () => {
  const error = new Error("discord down");
  const log = { info: jest.fn(), error: jest.fn() };
  await expect(
    notifier.send({
      channelId,
      post: { repository: { full_name: "foo/bar" } },
      log,
      discordClient: makeClient(jest.fn().mockRejectedValue(error)),
    }),
  ).rejects.toBe(error);
  expect(log.error).toHaveBeenCalledWith("[Notifier] Discord channel send failed", {
    error,
    event: "push",
    channelId,
    repository: "foo/bar",
  });
});
it("returns when no channel is configured", async () => {
  await expect(notifier.send({})).resolves.toBeUndefined();
});
