import { jest } from '@jest/globals';
import { createPresenceManager } from '../src/presenceManager.mjs';

test('starts with version presence and updates busy state', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0' });
  manager.start();
  manager.begin('deploying eliware/knit');
  await manager.begin('deploying eliware/knit');
  await new Promise(resolve => setImmediate(resolve));
  expect(setPresence).toHaveBeenNthCalledWith(1, expect.objectContaining({ activities: [{ name: '🧶 knit v2.2.0', type: 4 }] }));
  expect(setPresence).toHaveBeenNthCalledWith(2, expect.objectContaining({ activities: [{ name: '⏳ knitting deploying eliware/knit', type: 4 }] }));
});

test('waits for the Discord gateway bucket instead of dropping updates', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  let time = 0;
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0', now: () => time, setTimeoutFn: (resolve, delay) => { time += delay; resolve(); return {}; } });
  for (let i = 0; i < 6; i += 1) await manager.begin(`job ${i}`);
  expect(setPresence).toHaveBeenCalledTimes(6);
});

test('reserves a final update for terminal failures', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0' });
  manager.terminal('ignored while idle');
  manager.begin('received');
  manager.update('routing');
  manager.update('loading');
  manager.update('running');
  await manager.terminal('failed repository', true);
  await new Promise(resolve => setImmediate(resolve));
  expect(setPresence).toHaveBeenLastCalledWith(expect.objectContaining({ activities: [{ name: '❌ failed repository', type: 4 }] }));
});

test('returns to the version activity after the idle timer', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  let timer;
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0', setTimeoutFn: jest.fn(callback => { timer = callback; return { unref: jest.fn() }; }), clearTimeoutFn: jest.fn() });
  manager.begin('working');
  manager.update('still working');
  manager.end();
  timer();
  await new Promise(resolve => setImmediate(resolve));
  expect(setPresence).toHaveBeenCalledWith(expect.objectContaining({ activities: [{ name: '🧶 knit v2.2.0', type: 4 }] }));
  manager.stop();
});

test('ignores idle completion while another task is active and handles presence failures', async () => {
  const warn = jest.fn();
  const setPresence = jest.fn().mockRejectedValue(new Error('offline'));
  let timer;
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0', log: { warn }, setTimeoutFn: callback => { timer = callback; return {}; }, clearTimeoutFn: jest.fn() });
  manager.start();
  manager.begin();
  manager.end();
  manager.begin('again');
  timer();
  await new Promise(resolve => setImmediate(resolve));
  expect(warn).toHaveBeenCalled();
});

test('supports missing Discord client, duplicate updates, and timers without unref', async () => {
  const clearTimeoutFn = jest.fn();
  let timer;
  const manager = createPresenceManager({ version: '2.2.0', setTimeoutFn: callback => { timer = callback; return {}; }, clearTimeoutFn });
  manager.start();
  await manager.terminal('ignored while idle');
  manager.update('ignored while idle');
  manager.begin('same');
  manager.begin('still same work');
  await manager.terminal('completed');
  manager.update('same');
  manager.end();
  manager.end();
  timer();
  manager.stop();
  await new Promise(resolve => setImmediate(resolve));
  expect(clearTimeoutFn).toHaveBeenCalled();
});

test('does not restore idle presence while work is active', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  let timer;
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0', setTimeoutFn: callback => { timer = callback; return {}; }, clearTimeoutFn: jest.fn() });
  manager.begin('work');
  manager.end();
  manager.begin('new work');
  timer();
  expect(setPresence).not.toHaveBeenCalledWith(expect.objectContaining({ activities: [{ name: '🧶 knit v2.2.0', type: 4 }] }));
});

test('publishes a neutral ignored state while busy', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0' });
  await manager.begin('tag');
  await manager.neutral('eliware/elera-lib ignored');
  expect(setPresence).toHaveBeenLastCalledWith(expect.objectContaining({ activities: [{ name: 'ℹ️ eliware/elera-lib ignored', type: 4 }] }));
});

test('ignores terminal results from a stale delivery', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0' });
  await manager.begin('first', 'delivery-1');
  await manager.begin('second', 'delivery-2');
  await manager.terminal('first failure', true, 'delivery-1');
  expect(setPresence).not.toHaveBeenLastCalledWith(expect.objectContaining({ activities: [{ name: '❌ first failure', type: 4 }] }));
});

test('ignores stale neutral results and safely ends nested work', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0', clearTimeoutFn: jest.fn() });
  await manager.begin('first', 'delivery-1');
  await manager.begin('second', 'delivery-2');
  await manager.neutral('first ignored', 'delivery-1');
  manager.end();
  manager.end();
  await manager.neutral('idle ignored');
  expect(setPresence).not.toHaveBeenLastCalledWith(expect.objectContaining({ activities: [{ name: 'ℹ️ first ignored', type: 4 }] }));
});
