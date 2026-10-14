import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { publish, processTasks } from "../src/publisher.mjs";
import { getPublisherMetrics, _resetPublisherState } from "../src/publisherState.mjs";

const payload = { raw: "raw", parsed: "parsed" };
const wait = () => new Promise((resolve) => setImmediate(() => setTimeout(resolve, 5)));

beforeEach(() => {
  jest.restoreAllMocks();
  _resetPublisherState();
});

describe("publish", () => {
  it("queues and publishes with defaults", async () => {
    const Consumer = { consume: jest.fn().mockResolvedValue(true) };
    const log = { info: jest.fn(), error: jest.fn() };
    publish({ ...payload, log, ConsumerMod: Consumer });
    await wait();
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
    const immediate = jest.spyOn(global, "setImmediate").mockImplementation(() => {});
    publish({
      ...payload,
      event: undefined,
      deliveryId: undefined,
      log: undefined,
      ConsumerMod: undefined,
    });
    immediate.mockRestore();
  });

  it("deduplicates deliveries", () => {
    const log = { info: jest.fn() };
    const Consumer = { consume: jest.fn() };
    const immediate = jest.spyOn(global, "setImmediate").mockImplementation(() => {});
    expect(publish({ ...payload, deliveryId: "same", log, ConsumerMod: Consumer })).toBe(true);
    expect(publish({ ...payload, deliveryId: "same", log, ConsumerMod: Consumer })).toBe(false);
    expect(log.info).toHaveBeenCalledWith("[Publisher] Duplicate delivery ignored", "same");
    immediate.mockRestore();
  });

  it("allows a failed delivery to be sent again as a new request", async () => {
    const immediate = jest.spyOn(global, "setImmediate").mockImplementation(() => {});
    const log = { info: jest.fn(), error: jest.fn() };
    const Consumer = {
      consume: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
    };

    publish({ ...payload, deliveryId: "retry", log, ConsumerMod: Consumer });
    await processTasks(Consumer);
    expect(getPublisherMetrics()).toEqual(expect.objectContaining({ pending: 0, failed: 1 }));
    publish({ ...payload, deliveryId: "retry", log, ConsumerMod: Consumer });
    await processTasks(Consumer);
    immediate.mockRestore();

    expect(Consumer.consume).toHaveBeenCalledTimes(2);
    expect(getPublisherMetrics()).toEqual(
      expect.objectContaining({ succeeded: 1, failed: 1, pending: 0 }),
    );
  });

  it("evicts old delivery IDs", () => {
    const Consumer = { consume: jest.fn().mockResolvedValue(true) };
    const log = { info: jest.fn(), error: jest.fn() };
    const immediate = jest.spyOn(global, "setImmediate").mockImplementation(() => {});
    for (let i = 0; i <= 1000; i += 1)
      publish({ ...payload, deliveryId: `id-${i}`, log, ConsumerMod: Consumer });
    expect(publish({ ...payload, deliveryId: "id-0", log, ConsumerMod: Consumer })).toBe(true);
    immediate.mockRestore();
  });
});

describe("processing", () => {
  it("covers the default processor and ignores an empty scheduled queue", async () => {
    await expect(processTasks()).resolves.toBeUndefined();

    const callbacks = [];
    const immediate = jest
      .spyOn(global, "setImmediate")
      .mockImplementation((fn) => callbacks.push(fn));
    publish({ ...payload, ConsumerMod: { consume: jest.fn() } });
    _resetPublisherState();
    callbacks[0]();
    await Promise.resolve();
    immediate.mockRestore();
    expect(getPublisherMetrics().processed).toBe(0);
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
    const immediate = jest.spyOn(global, "setImmediate").mockImplementation((fn) => fn());
    publish({ ...payload, log, ConsumerMod: Consumer });
    publish({ ...payload, log, ConsumerMod: Consumer });
    expect(getPublisherMetrics().processing).toBe(true);
    resolve(true);
    await Promise.resolve();
    await Promise.resolve();
    immediate.mockRestore();
    expect(Consumer.consume).toHaveBeenCalledTimes(2);
  });

  it("continues draining after an unexpected task error", async () => {
    const immediate = jest.spyOn(global, "setImmediate").mockImplementation(() => {});
    const brokenLog = {
      info: jest.fn(),
      error: jest.fn(() => {
        throw new Error("logger failed");
      }),
    };
    publish({ ...payload, deliveryId: "bad", log: brokenLog });
    publish({ ...payload, deliveryId: "good", log: { info: jest.fn(), error: jest.fn() } });
    const Consumer = {
      consume: jest.fn(async ({ message }) => message.deliveryId === "good"),
    };

    await processTasks(Consumer);
    immediate.mockRestore();

    expect(getPublisherMetrics()).toEqual(
      expect.objectContaining({ pending: 0, processing: false, succeeded: 1 }),
    );
    expect(Consumer.consume).toHaveBeenCalledTimes(2);
  });
});
test("uses the default publisher logger", async () => {
  const Consumer = { consume: jest.fn().mockResolvedValue(true) };
  publish({ raw: "", parsed: {}, ConsumerMod: Consumer });
  await new Promise((resolve) => setImmediate(resolve));
  expect(Consumer.consume).toHaveBeenCalled();
});
