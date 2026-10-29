import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { publish } from "../src/publisher.mjs";
import { getPublisherMetrics, _resetPublisherState } from "../src/publisherState.mjs";

const payload = { raw: "raw", parsed: "parsed" };
const noSchedule = () => {};

beforeEach(() => {
  jest.restoreAllMocks();
  _resetPublisherState();
});

it("queues and publishes with defaults", async () => {
  const Consumer = { consume: jest.fn().mockResolvedValue(true) };
  const log = { info: jest.fn(), error: jest.fn() };
  let scheduled;
  publish({
    ...payload,
    log,
    ConsumerMod: Consumer,
    schedule: (callback) => (scheduled = callback),
  });
  await scheduled();
  expect(Consumer.consume).toHaveBeenCalledWith({
    message: { ...payload, event: "push", deliveryId: null },
    log,
  });
  expect(getPublisherMetrics()).toEqual(
    expect.objectContaining({
      queued: 1,
      processed: 1,
      succeeded: 1,
      failed: 0,
      pending: 0,
      processing: false,
    }),
  );
  publish({
    ...payload,
    event: undefined,
    deliveryId: undefined,
    log: undefined,
    ConsumerMod: undefined,
    schedule: noSchedule,
  });
});

it("deduplicates deliveries", () => {
  const log = { info: jest.fn() };
  const Consumer = { consume: jest.fn() };
  expect(
    publish({ ...payload, deliveryId: "same", log, ConsumerMod: Consumer, schedule: noSchedule }),
  ).toBe(true);
  expect(
    publish({ ...payload, deliveryId: "same", log, ConsumerMod: Consumer, schedule: noSchedule }),
  ).toBe(false);
  expect(log.info).toHaveBeenCalledWith("[Publisher] Duplicate request ignored", "same");
});

it("keeps pending delivery IDs when the queue grows", () => {
  const Consumer = { consume: jest.fn().mockResolvedValue(true) };
  const log = { info: jest.fn(), error: jest.fn() };
  for (let i = 0; i <= 1000; i += 1)
    publish({
      ...payload,
      deliveryId: `id-${i}`,
      log,
      ConsumerMod: Consumer,
      schedule: noSchedule,
    });
  expect(
    publish({ ...payload, deliveryId: "id-0", log, ConsumerMod: Consumer, schedule: noSchedule }),
  ).toBe(false);
});

it("normalizes zero attempts and tolerates concurrent scheduling", async () => {
  let resolve;
  const Consumer = {
    consume: jest.fn(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    ),
  };
  const log = { info: jest.fn(), error: jest.fn() };
  publish({ ...payload, log, ConsumerMod: Consumer, schedule: (callback) => callback() });
  publish({ ...payload, log, ConsumerMod: Consumer, schedule: (callback) => callback() });
  expect(getPublisherMetrics().processing).toBe(true);
  resolve(true);
  await Promise.resolve();
  await Promise.resolve();
  expect(Consumer.consume).toHaveBeenCalledTimes(2);
});

test("uses default publisher dependencies", async () => {
  jest.useFakeTimers();
  try {
    publish({ raw: "", parsed: {} });
    expect(getPublisherMetrics()).toEqual(
      expect.objectContaining({ queued: 1, processed: 0, pending: 1 }),
    );
    jest.clearAllTimers();
  } finally {
    jest.useRealTimers();
  }
});
