import { jest } from "@jest/globals";
import { processPublisherTask } from "../src/publisherProcessor.mjs";

const makeTask = (overrides = {}) => ({
  raw: "raw",
  parsed: "parsed",
  event: "push",
  deliveryId: "delivery",
  log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  ...overrides,
});
const makeRecorder = () => {
  const metrics = { processed: 0, succeeded: 0, failed: 0, retried: 0 };
  return { metrics, recordMetric: (name) => (metrics[name] += 1) };
};

test("sends a successful task once", async () => {
  const task = makeTask();
  const ConsumerMod = {
    consume: jest.fn().mockResolvedValue(true),
  };
  const { metrics, recordMetric } = makeRecorder();
  await processPublisherTask({ task, ConsumerMod, recordMetric });
  expect(ConsumerMod.consume).toHaveBeenCalledTimes(1);
  expect(metrics).toEqual({ processed: 1, succeeded: 1, failed: 0, retried: 0 });
});

test("counts and logs a task failure", async () => {
  const task = makeTask();
  const error = new Error("failure");
  const ConsumerMod = { consume: jest.fn().mockRejectedValue(error) };
  const { metrics, recordMetric } = makeRecorder();
  await processPublisherTask({ task, ConsumerMod, recordMetric });
  expect(metrics).toEqual({ processed: 1, succeeded: 0, failed: 1, retried: 0 });
  expect(task.log.error).toHaveBeenCalledWith("[Publisher] Error sending to Consumer:", error);
});

test("fails once when the consumer returns false", async () => {
  const task = makeTask({ log: { info: jest.fn(), error: jest.fn() } });
  const ConsumerMod = {
    consume: jest.fn().mockResolvedValue(false),
  };
  const { metrics, recordMetric } = makeRecorder();
  await processPublisherTask({ task, ConsumerMod, recordMetric });
  expect(ConsumerMod.consume).toHaveBeenCalledTimes(1);
  expect(task.log.error).toHaveBeenCalledWith(
    "[Publisher] Error sending to Consumer:",
    new Error("Consumer returned false"),
  );
  expect(metrics).toEqual({ processed: 1, succeeded: 0, failed: 1, retried: 0 });
});
