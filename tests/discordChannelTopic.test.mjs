import { jest } from "@jest/globals";
import { syncChannelTopic } from "../src/discordChannelTopic.mjs";

test("updates a channel when package metadata provides a new topic", async () => {
  const edit = jest.fn();
  await syncChannelTopic({ edit, topic: "old topic" }, { description: "New topic" });
  expect(edit).toHaveBeenCalledWith({ topic: "New topic" });
});

test("skips an empty topic, a matching topic, and unsupported edits", async () => {
  const edit = jest.fn();
  await syncChannelTopic({ edit, topic: "same" }, { description: "same" });
  await syncChannelTopic({ edit }, {});
  await syncChannelTopic({}, { description: "topic" });
  expect(edit).not.toHaveBeenCalled();
});

test("clears a stale topic when package metadata has no topic text", async () => {
  const edit = jest.fn();
  await syncChannelTopic({ edit, topic: "old topic" }, {});
  expect(edit).toHaveBeenCalledWith({ topic: "" });
});
