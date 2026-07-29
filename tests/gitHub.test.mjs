import { jest } from '@jest/globals'; // Importing jest for ESM support
// Tests for src/gitHub.mjs
import { validate } from '../src/gitHub.mjs';

describe('gitHub.mjs', () => {
  const log = { error: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false and log error if post or repository is missing', () => {
    expect(validate({ post: null, log })).toBe(false);
    expect(log.error).toHaveBeenCalled();
    expect(validate({ post: {}, log })).toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('should return true if post.repository exists', () => {
    expect(validate({ post: { repository: {} }, log })).toBe(true);
  });
});
