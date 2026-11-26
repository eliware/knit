import { jest } from "@jest/globals";
import __knitModule0 from "../src/discordChannelTopic.mjs";
const { syncChannelTopic } = __knitModule0;
test("updates a channel when package metadata provides a new topic", async () => {
  const edit = jest.fn();
  await syncChannelTopic(
    {
      edit,
      topic: "old topic",
    },
    {
      description: "New topic",
    },
  );
  expect(edit).toHaveBeenCalledWith({
    topic: "New topic",
  });
});
test("skips an empty topic, a matching topic, and unsupported edits", async () => {
  const edit = jest.fn();
  await syncChannelTopic(
    {
      edit,
      topic: "same",
    },
    {
      description: "same",
    },
  );
  await syncChannelTopic(
    {
      edit,
    },
    {},
  );
  await syncChannelTopic(
    {},
    {
      description: "topic",
    },
  );
  expect(edit).not.toHaveBeenCalled();
});
test("clears a stale topic when package metadata has no topic text", async () => {
  const edit = jest.fn();
  await syncChannelTopic(
    {
      edit,
      topic: "old topic",
    },
    {},
  );
  expect(edit).toHaveBeenCalledWith({
    topic: "",
  });
});
test("keeps the current topic when package metadata is unavailable", async () => {
  const edit = jest.fn();
  await syncChannelTopic(
    {
      edit,
      topic: "current topic",
    },
    undefined,
  );
  expect(edit).not.toHaveBeenCalled();
});
