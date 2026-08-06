import { jest } from '@jest/globals';
import { validate } from '../src/gitHub.mjs';

describe('gitHub validation', () => {
  test.each([null, undefined, 'payload', 42, false])('rejects invalid post: %p', (post) => {
    const log = { error: jest.fn() };

    expect(validate({ post, log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('GitHub::validate post not set', post);
  });

  test('requires repository data for push events', () => {
    const log = { error: jest.fn() };

    expect(validate({ post: {}, log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('GitHub::validate post repository not set', {});
  });

  test('accepts push events with repository data', () => {
    expect(validate({ post: { repository: { full_name: 'eliware/knit' } } })).toBe(true);
  });

  test('accepts repository events', () => {
    expect(validate({ post: { repository: { full_name: 'eliware/knit' } }, event: 'release' })).toBe(true);
  });

  test('accepts organization-level events', () => {
    expect(validate({ post: { organization: { login: 'eliware' } }, event: 'organization' })).toBe(true);
    expect(validate({ post: { action: 'ping' }, event: 'ping' })).toBe(true);
  });
});
