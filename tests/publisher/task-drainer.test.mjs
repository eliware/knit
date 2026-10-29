import "../../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { enqueuePublisherTask } from "../../src/publisherQueue.mjs";
import { processTasks } from "../../src/publisher/task-drainer.mjs";
import { getPublisherMetrics, _resetPublisherState } from "../../src/publisherState.mjs";

const task = (deliveryId, log = { info: jest.fn(), error: jest.fn() }) => ({
  raw: "raw",
  parsed: "parsed",
  event: "push",
  deliveryId,
  log,
});

beforeEach(() => {
  jest.restoreAllMocks();
  _resetPublisherState();
});

it("allows a failed task to be queued again", async () => {
  const Consumer = {
    consume: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
  };
  enqueuePublisherTask(task("retry"));
  await processTasks(Consumer);
  expect(getPublisherMetrics()).toEqual(expect.objectContaining({ pending: 0, failed: 1 }));

  enqueuePublisherTask(task("retry"));
  await processTasks(Consumer);

  expect(Consumer.consume).toHaveBeenCalledTimes(2);
  expect(getPublisherMetrics()).toEqual(
    expect.objectContaining({ succeeded: 1, failed: 1, pending: 0 }),
  );
});

it("returns when the task queue is empty", async () => {
  await expect(processTasks()).resolves.toBeUndefined();
  expect(getPublisherMetrics()).toEqual(expect.objectContaining({ processed: 0, pending: 0 }));
});

it("continues draining after an unexpected task error", async () => {
  const brokenLog = {
    info: jest.fn(),
    error: jest.fn(() => {
      throw new Error("logger failed");
    }),
  };
  enqueuePublisherTask(task("bad", brokenLog));
  enqueuePublisherTask(task("good"));
  const Consumer = {
    consume: jest.fn(async ({ message }) => message.deliveryId === "good"),
  };

  await processTasks(Consumer);

  expect(getPublisherMetrics()).toEqual(
    expect.objectContaining({ pending: 0, processing: false, succeeded: 1 }),
  );
  expect(Consumer.consume).toHaveBeenCalledTimes(2);
});
