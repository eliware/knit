import { jest } from "@jest/globals";
import { crosspostReleaseAnnouncement } from "../../src/notifier/releaseCrosspost.mjs";

test("cross-posts versioned release tags and records the tag", async () => {
  const message = { crosspost: jest.fn() };
  const log = { info: jest.fn() };
  await crosspostReleaseAnnouncement({
    message,
    post: { ref: "refs/tags/v1.2.3" },
    channelId: "channel",
    log,
  });
  expect(message.crosspost).toHaveBeenCalled();
  expect(log.info).toHaveBeenCalledWith("[Notifier] Cross-posted release announcement", {
    channelId: "channel",
    tag: "v1.2.3",
  });
});

test.each(["refs/heads/main", "refs/tags/test"])("does not cross-post %s", async (ref) => {
  const message = { crosspost: jest.fn() };
  const log = { info: jest.fn() };
  await crosspostReleaseAnnouncement({ message, post: { ref }, channelId: "channel", log });
  expect(message.crosspost).not.toHaveBeenCalled();
  expect(log.info).not.toHaveBeenCalled();
});

test("does not cross-post a message without crosspost support", async () => {
  const log = { info: jest.fn() };
  await crosspostReleaseAnnouncement({
    message: {},
    post: { ref: "refs/tags/v1.2.3" },
    channelId: "channel",
    log,
  });
  expect(log.info).not.toHaveBeenCalled();
});
