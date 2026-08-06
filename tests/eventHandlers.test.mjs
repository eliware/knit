import { jest } from '@jest/globals';
import { createRegistry, createGenericHandler, createDefaultRegistry } from '../src/eventHandlers.mjs';

describe('eventHandlers', () => {
  test('registers and dispatches handlers', async () => {
    const handler = jest.fn().mockResolvedValue(true);
    const registry = createRegistry().register('issues', handler);
    const result = await registry.dispatch({ event: 'issues', post: {}, target: {} });
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalled();
    expect(registry.has('issues')).toBe(true);
    expect(registry.size()).toBe(1);
  });

  test('rejects invalid registrations', () => {
    expect(() => createRegistry().register('', () => {})).toThrow(TypeError);
    expect(() => createRegistry().register('x', null)).toThrow(TypeError);
  });

  test('uses wildcard handler', async () => {
    const handler = jest.fn().mockResolvedValue(true);
    const registry = createRegistry().register('*', handler);
    await expect(registry.dispatch({ event: 'ping', post: {}, target: {} })).resolves.toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  test('returns false when no handler exists', async () => {
    await expect(createRegistry().dispatch({ event: 'ping', post: {}, target: {} })).resolves.toBe(false);
  });

  test('generic handler sends to configured target', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const handler = createGenericHandler({ Notifier: { send } });
    await expect(handler({ event: 'ping', post: {}, target: { repo: { notify: 'url' } } })).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ notifyUrl: 'url', event: 'ping' }));
  });

  test('generic handler succeeds without a notification target', async () => {
    const send = jest.fn();
    await expect(createGenericHandler({ Notifier: { send } })({ event: 'ping', post: {}, target: {} })).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  test('default registry includes wildcard handler', () => {
    expect(createDefaultRegistry().has('unknown')).toBe(true);
  });
});
