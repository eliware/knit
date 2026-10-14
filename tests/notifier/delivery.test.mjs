import { jest } from "@jest/globals";
import { deliverDiscordMessage } from "../../src/notifier/delivery.mjs";

test("sends a message and cross-posts a release tag", async () => {
  const crosspost = jest.fn().mockResolvedValue(undefined);
  const send = jest.fn().mockResolvedValue({ crosspost });
  const log = { info: jest.fn(), error: jest.fn() };
  await deliverDiscordMessage({
    discordClient: { channels: { fetch: jest.fn().mockResolvedValue({ send }) } },
    channelId: "channel",
    embed: { title: "Release" },
    post: { ref: "refs/tags/v1.0.0" },
    event: "push",
    log,
  });
  expect(send).toHaveBeenCalledWith({ embeds: [{ title: "Release" }] });
  expect(crosspost).toHaveBeenCalled();
});

test("logs and rethrows a failed Discord delivery", async () => {
  const error = new Error("offline");
  const log = { info: jest.fn(), error: jest.fn() };
  await expect(
    deliverDiscordMessage({
      discordClient: { channels: { fetch: jest.fn().mockRejectedValue(error) } },
      channelId: "channel",
      embed: {},
      post: { repository: { full_name: "o/r" } },
      event: "push",
      log,
    }),
  ).rejects.toBe(error);
  expect(log.error).toHaveBeenCalledWith(
    "[Notifier] Discord channel send failed",
    expect.objectContaining({ error, repository: "o/r" }),
  );
});

test.each([
  ["a missing channel", undefined],
  ["a non-sendable channel", {}],
])("rejects when Discord returns %s", async (_label, channel) => {
  const log = { info: jest.fn(), error: jest.fn() };
  const discordClient = { channels: { fetch: jest.fn().mockResolvedValue(channel) } };
  await expect(
    deliverDiscordMessage({
      discordClient,
      channelId: "channel",
      embed: {},
      post: {},
      event: "push",
      log,
    }),
  ).rejects.toThrow("Discord channel is not sendable: channel");
  expect(log.error).toHaveBeenCalled();
});

test("logs send failures with channel and repository context", async () => {
  const error = new Error("discord down");
  const log = { info: jest.fn(), error: jest.fn() };
  await expect(
    deliverDiscordMessage({
      discordClient: {
        channels: {
          fetch: jest.fn().mockResolvedValue({ send: jest.fn().mockRejectedValue(error) }),
        },
      },
      channelId: "channel",
      embed: {},
      post: { repository: { full_name: "foo/bar" } },
      event: "push",
      log,
    }),
  ).rejects.toBe(error);
  expect(log.error).toHaveBeenCalledWith("[Notifier] Discord channel send failed", {
    error,
    event: "push",
    channelId: "channel",
    repository: "foo/bar",
  });
});
