import { jest } from '@jest/globals';
test('knit.mjs can be imported without error', async () => {
  process.env.LOG_LEVEL = 'none';
  await import('../knit.mjs');
  expect(true).toBe(true);
});