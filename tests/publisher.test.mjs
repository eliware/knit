import { jest } from '@jest/globals';
import { publish, _resetPublisherState } from '../src/publisher.mjs';

describe('publisher.mjs', () => {
  const log = { info: jest.fn(), error: jest.fn() };
  let Consumer;
  beforeEach(() => {
    jest.clearAllMocks();
    _resetPublisherState();
    Consumer = { consume: jest.fn() };
  });

  it('should queue a payload and process tasks', () => {
    const spy = jest.spyOn(global, 'setImmediate').mockImplementation(fn => fn());
    publish({ raw: 'raw', parsed: 'parsed', log, ConsumerMod: Consumer });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should process tasks and call Consumer.consume', async () => {
    Consumer.consume.mockResolvedValue(true);
    publish({ raw: 'raw', parsed: 'parsed', log, ConsumerMod: Consumer });
    await new Promise(r => setTimeout(r, 10));
    expect(Consumer.consume).toHaveBeenCalled();
  });

  it('should log error if Consumer.consume throws', async () => {
    Consumer.consume.mockRejectedValue(new Error('fail'));
    publish({ raw: 'raw', parsed: 'parsed', log, ConsumerMod: Consumer });
    await new Promise(r => setTimeout(r, 10));
    expect(log.error).toHaveBeenCalled();
  });
});
