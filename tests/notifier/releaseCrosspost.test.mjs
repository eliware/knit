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

test.each([
  ["refs/heads/main", { crosspost: jest.fn() }],
  ["refs/tags/test", { crosspost: jest.fn() }],
  ["refs/tags/v1.2.3", {}],
])("does not cross-post %s when a prerequisite is missing", async (ref, message) => {
  const log = { info: jest.fn() };
  await crosspostReleaseAnnouncement({ message, post: { ref }, channelId: "channel", log });
  if (typeof message.crosspost === "function") expect(message.crosspost).not.toHaveBeenCalled();
  expect(log.info).not.toHaveBeenCalled();
});
