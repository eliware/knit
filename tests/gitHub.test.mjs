import { jest } from '@jest/globals';
import { validate } from '../src/gitHub.mjs';

describe('gitHub validation', () => {
  test('requires repository data for push events', () => {
    const log = { error: jest.fn() };
    expect(validate({ post: {}, event: 'push', log })).toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  test('accepts repository events', () => {
    expect(validate({ post: { repository: { full_name: 'eliware/knit' } }, event: 'release' })).toBe(true);
  });

  test('accepts organization-level events', () => {
    expect(validate({ post: { organization: { login: 'eliware' } }, event: 'organization' })).toBe(true);
    expect(validate({ post: { action: 'ping' }, event: 'ping' })).toBe(true);
  });
});
