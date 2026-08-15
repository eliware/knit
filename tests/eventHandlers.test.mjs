import { jest } from '@jest/globals';
import { createRegistry, createGenericHandler, createDefaultRegistry } from '../src/eventHandlers.mjs';

const post = { id: 1 };
const target = { repo: { discordChannelId: '123456789012345678' } };
const log = { info: jest.fn() };

describe('eventHandlers', () => {
  test('registers, overwrites, and dispatches handlers', async () => {
    const first = jest.fn().mockResolvedValue('first');
    const handler = jest.fn().mockResolvedValue(true);
    const registry = createRegistry({ Notifier: { send: jest.fn() } });

    expect(registry.register('issues', first)).toBe(registry);
    expect(registry.register('issues', handler)).toBe(registry);
    await expect(registry.dispatch({ event: 'issues', post, target, deliveryId: 'delivery', log })).resolves.toBe(true);
    expect(handler).toHaveBeenCalledWith({ event: 'issues', post, target, deliveryId: 'delivery', log });
    expect(first).not.toHaveBeenCalled();
    expect(registry.has('issues')).toBe(true);
    expect(registry.has('missing')).toBe(false);
    expect(registry.size()).toBe(1);
    expect(registry.notifier.send).toBeDefined();
  });

  test('rejects invalid registrations', () => {
    const registry = createRegistry();
    expect(() => registry.register('', () => {})).toThrow(TypeError);
    expect(() => registry.register('x', null)).toThrow(TypeError);
    expect(() => registry.register('x', {})).toThrow('Event and handler are required');
  });

  test('uses wildcard handler and default delivery id/log', async () => {
    const handler = jest.fn().mockResolvedValue(true);
    const registry = createRegistry().register('*', handler);
    await expect(registry.dispatch({ event: 'ping', post, target })).resolves.toBe(true);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ deliveryId: null, log: expect.anything() }));
    expect(registry.has('ping')).toBe(true);
  });

  test('event handler takes precedence over wildcard', async () => {
    const specific = jest.fn().mockResolvedValue('specific');
    const wildcard = jest.fn().mockResolvedValue('wildcard');
    const registry = createRegistry().register('*', wildcard).register('ping', specific);
    await expect(registry.dispatch({ event: 'ping', post, target })).resolves.toBe('specific');
    expect(wildcard).not.toHaveBeenCalled();
  });

  test('returns false when no handler exists', async () => {
    await expect(createRegistry().dispatch({ event: 'ping', post, target })).resolves.toBe(false);
  });

  test('generic handler supports default parameters', async () => {
    await expect(createGenericHandler()({ event: 'ping', post, target: {} })).resolves.toBe(true);
  });

  test('generic handler sends configured target and supports fixed event', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const handler = createGenericHandler({ Notifier: { send }, eventName: 'fixed_event' });
    await expect(handler({ event: 'ping', post, target, log })).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith({ channelId: '123456789012345678', post, event: 'fixed_event', logOutput: '', hasError: false, log });
  });

  test('generic handler uses event when fixed event is empty', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    await createGenericHandler({ Notifier: { send }, eventName: '' })({ event: 'ping', post, target });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event: 'ping' }));
  });

  test('generic handler succeeds without notification target', async () => {
    const send = jest.fn();
    const handler = createGenericHandler({ Notifier: { send } });
    await expect(handler({ event: 'ping', post, target: {} })).resolves.toBe(true);
    await expect(handler({ event: 'ping', post, target: null })).resolves.toBe(true);
    await expect(handler({ event: 'ping', post })).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  test('default registry registers specialized events and wildcard', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const registry = createDefaultRegistry({ Notifier: { send } });
    expect(registry.has('unknown')).toBe(true);
    expect(registry.size()).toBe(7);
    await expect(registry.dispatch({ event: 'issues', post: { action: 'opened' }, target })).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event: 'issues', channelId: '123456789012345678' }));
    await expect(registry.dispatch({ event: 'unknown', post, target: {} })).resolves.toBe(true);
  });
});
