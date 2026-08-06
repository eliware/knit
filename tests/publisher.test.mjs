import { jest } from '@jest/globals';
import { publish, processTasks, getPublisherMetrics, _resetPublisherState } from '../src/publisher.mjs';

const payload = { raw: 'raw', parsed: 'parsed' };
const wait = () => new Promise(resolve => setImmediate(() => setTimeout(resolve, 5)));

beforeEach(() => {
  jest.restoreAllMocks();
  _resetPublisherState();
});

describe('publish', () => {
  it('queues and publishes with defaults', async () => {
    const Consumer = { consume: jest.fn().mockResolvedValue(true) };
    const log = { info: jest.fn(), error: jest.fn() };
    publish({ ...payload, log, ConsumerMod: Consumer });
    await wait();
    expect(Consumer.consume).toHaveBeenCalledWith({
      message: { ...payload, event: 'push', deliveryId: null }, log,
    });
    expect(getPublisherMetrics()).toEqual(expect.objectContaining({
      queued: 1, processed: 1, succeeded: 1, failed: 0, pending: 0, processing: false,
    }));
    const immediate = jest.spyOn(global, 'setImmediate').mockImplementation(() => {});
    publish({ ...payload, event: undefined, deliveryId: undefined, log: undefined, ConsumerMod: undefined, maxAttempts: undefined, retryDelayMs: undefined });
    immediate.mockRestore();
  });

  it('deduplicates deliveries', () => {
    const log = { info: jest.fn() };
    const Consumer = { consume: jest.fn() };
    const immediate = jest.spyOn(global, 'setImmediate').mockImplementation(() => {});
    expect(publish({ ...payload, deliveryId: 'same', log, ConsumerMod: Consumer })).toBeUndefined();
    expect(publish({ ...payload, deliveryId: 'same', log, ConsumerMod: Consumer })).toBe(false);
    expect(log.info).toHaveBeenCalledWith('[Publisher] Duplicate delivery ignored', 'same');
    immediate.mockRestore();
  });

  it('evicts old delivery IDs', () => {
    const Consumer = { consume: jest.fn().mockResolvedValue(true) };
    const log = { info: jest.fn(), error: jest.fn() };
    const immediate = jest.spyOn(global, 'setImmediate').mockImplementation(() => {});
    for (let i = 0; i <= 1000; i += 1) publish({ ...payload, deliveryId: `id-${i}`, log, ConsumerMod: Consumer });
    expect(publish({ ...payload, deliveryId: 'id-0', log, ConsumerMod: Consumer })).toBeUndefined();
    immediate.mockRestore();
  });
});

describe('processing', () => {
  it('retries a false result and uses info when warn is absent', async () => {
    const Consumer = { consume: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true) };
    const log = { info: jest.fn(), error: jest.fn() };
    publish({ ...payload, event: 'release', deliveryId: 'id', log, ConsumerMod: Consumer, maxAttempts: 2, retryDelayMs: 0 });
    await wait();
    expect(Consumer.consume).toHaveBeenCalledTimes(2);
    expect(log.info).toHaveBeenCalledWith('[Publisher] Consumer failed; retrying', expect.any(Object));
    expect(getPublisherMetrics()).toEqual(expect.objectContaining({ retried: 1, succeeded: 1 }));
  });

  it('logs final failures after retries', async () => {
    const error = new Error('fail');
    const Consumer = { consume: jest.fn().mockRejectedValue(error) };
    const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    publish({ ...payload, log, ConsumerMod: Consumer, maxAttempts: 2, retryDelayMs: 0 });
    await wait();
    expect(Consumer.consume).toHaveBeenCalledTimes(2);
    expect(log.warn).toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith('[Publisher] Error sending to Consumer:', error);
    expect(getPublisherMetrics()).toEqual(expect.objectContaining({ failed: 1, retried: 1, succeeded: 0 }));
  });

  it('covers the default processor and ignores an empty scheduled queue', async () => {
    await processTasks();


    const callbacks = [];
    const immediate = jest.spyOn(global, 'setImmediate').mockImplementation(fn => callbacks.push(fn));
    publish({ ...payload, ConsumerMod: { consume: jest.fn() } });
    _resetPublisherState();
    callbacks[0]();
    await Promise.resolve();
    immediate.mockRestore();
    expect(getPublisherMetrics().processed).toBe(0);
  });

  it('normalizes zero attempts and tolerates concurrent scheduling', async () => {
    let resolve;
    const Consumer = { consume: jest.fn(() => new Promise(r => { resolve = r; })) };
    const log = { info: jest.fn(), error: jest.fn() };
    const immediate = jest.spyOn(global, 'setImmediate').mockImplementation(fn => fn());
    publish({ ...payload, log, ConsumerMod: Consumer, maxAttempts: 0 });
    publish({ ...payload, log, ConsumerMod: Consumer, maxAttempts: 1 });
    expect(getPublisherMetrics().processing).toBe(true);
    resolve(true);
    await Promise.resolve();
    await Promise.resolve();
    immediate.mockRestore();
    expect(Consumer.consume).toHaveBeenCalledTimes(2);
  });
});
