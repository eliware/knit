import { jest } from '@jest/globals';
import { publish, _resetPublisherState } from '../src/publisher.mjs';

describe('publisher.mjs', () => {
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  let Consumer;
  beforeEach(() => {
    jest.clearAllMocks();
    _resetPublisherState();
    Consumer = { consume: jest.fn() };
  });

  it('should queue a payload and process tasks', () => {
    const spy = jest.spyOn(global, 'setImmediate').mockImplementation(fn => fn());
    publish({ raw: 'raw', parsed: 'parsed', event: 'release', deliveryId: 'delivery-1', log, ConsumerMod: Consumer });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should process tasks and call Consumer.consume', async () => {
    Consumer.consume.mockResolvedValue(true);
    publish({ raw: 'raw', parsed: 'parsed', event: 'release', deliveryId: 'delivery-1', log, ConsumerMod: Consumer });
    await new Promise(r => setTimeout(r, 10));
    expect(Consumer.consume).toHaveBeenCalledWith({ message: { raw: 'raw', parsed: 'parsed', event: 'release', deliveryId: 'delivery-1' }, log });
  });

  it('should retry failures and log the final error', async () => {
    Consumer.consume.mockRejectedValue(new Error('fail'));
    publish({ raw: 'raw', parsed: 'parsed', deliveryId: 'delivery-1', log, ConsumerMod: Consumer, maxAttempts: 2, retryDelayMs: 0 });
    await new Promise(r => setTimeout(r, 20));
    expect(Consumer.consume).toHaveBeenCalledTimes(2);
    expect(log.warn).toHaveBeenCalled();
    expect(log.error).toHaveBeenCalled();
  });

  it('reports publisher metrics', async () => {
    Consumer.consume.mockResolvedValue(true);
    publish({ raw: 'raw', parsed: 'parsed', deliveryId: 'delivery-1', log, ConsumerMod: Consumer });
    await new Promise(r => setTimeout(r, 10));
    const { getPublisherMetrics } = await import('../src/publisher.mjs');
    expect(getPublisherMetrics()).toEqual(expect.objectContaining({ queued: 1, processed: 1, succeeded: 1, failed: 0 }));
  });
});

describe('delivery deduplication', () => {
  test('ignores duplicate delivery IDs', () => {
    const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const Consumer = { consume: jest.fn() };
    const spy = jest.spyOn(global, 'setImmediate').mockImplementation(fn => fn());
    expect(publish({ raw: 'raw', parsed: 'parsed', deliveryId: 'same', log, ConsumerMod: Consumer })).not.toBe(false);
    expect(publish({ raw: 'raw', parsed: 'parsed', deliveryId: 'same', log, ConsumerMod: Consumer })).toBe(false);
    expect(log.info).toHaveBeenCalledWith('[Publisher] Duplicate delivery ignored', 'same');
    spy.mockRestore();
  });
});
