import { jest } from '@jest/globals';
import { createPresenceManager } from '../src/presenceManager.mjs';

test('starts with version presence and updates busy state', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0' });
  manager.start();
  manager.begin('deploying eliware/knit');
  await new Promise(resolve => setImmediate(resolve));
  expect(setPresence).toHaveBeenNthCalledWith(1, expect.objectContaining({ activities: [{ name: '🧶 knit v2.2.0', type: 4 }] }));
  expect(setPresence).toHaveBeenNthCalledWith(2, expect.objectContaining({ activities: [{ name: 'deploying eliware/knit', type: 4 }] }));
});

test('drops updates after the Discord gateway bucket is full', async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  let time = 0;
  const manager = createPresenceManager({ client: { user: { setPresence } }, version: '2.2.0', now: () => time });
  for (let i = 0; i < 6; i += 1) { manager.begin(`job ${i}`); manager.end(); }
  await new Promise(resolve => setImmediate(resolve));
  expect(setPresence).toHaveBeenCalledTimes(5);
  time = 20_001;
  manager.begin('after window');
  await new Promise(resolve => setImmediate(resolve));
  expect(setPresence).toHaveBeenCalledTimes(6);
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
