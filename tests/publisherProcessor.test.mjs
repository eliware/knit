import { jest } from "@jest/globals";
import { processPublisherTask } from "../src/publisherProcessor.mjs";

const makeTask = (overrides = {}) => ({
  raw: "raw",
  parsed: "parsed",
  event: "push",
  deliveryId: "delivery",
  log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  maxAttempts: 2,
  retryDelayMs: 0,
  ...overrides,
});
const makeRecorder = () => {
  const metrics = { processed: 0, succeeded: 0, failed: 0, retried: 0 };
  return { metrics, recordMetric: (name) => (metrics[name] += 1) };
};

test("retries a failed task and counts success", async () => {
  const task = makeTask();
  const ConsumerMod = {
    consume: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
  };
  const { metrics, recordMetric } = makeRecorder();
  await processPublisherTask({ task, ConsumerMod, recordMetric });
  expect(metrics).toEqual({ processed: 1, succeeded: 1, failed: 0, retried: 1 });
});

test("counts and logs a final task failure", async () => {
  const task = makeTask({ maxAttempts: 1 });
  const error = new Error("failure");
  const ConsumerMod = { consume: jest.fn().mockRejectedValue(error) };
  const { metrics, recordMetric } = makeRecorder();
  await processPublisherTask({ task, ConsumerMod, recordMetric });
  expect(metrics).toEqual({ processed: 1, succeeded: 0, failed: 1, retried: 0 });
  expect(task.log.error).toHaveBeenCalledWith("[Publisher] Error sending to Consumer:", error);
});

test("retries a false result and falls back to info without a warn method", async () => {
  const task = makeTask({ log: { info: jest.fn(), error: jest.fn() } });
  const ConsumerMod = {
    consume: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
  };
  const { metrics, recordMetric } = makeRecorder();
  await processPublisherTask({ task, ConsumerMod, recordMetric });
  expect(task.log.info).toHaveBeenCalledWith(
    "[Publisher] Consumer failed; retrying",
    expect.objectContaining({ attempt: 1, maxAttempts: 2 }),
  );
  expect(metrics).toEqual({ processed: 1, succeeded: 1, failed: 0, retried: 1 });
});
