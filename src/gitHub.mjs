import { log as logger } from '@eliware/common';

/**
 * Validates a GitHub webhook payload.
 * @param {Object} params
 * @param {Object} params.post - The webhook payload.
 * @param {Object} [params.log] - Logger instance to use.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ post, event = 'push', log = logger }) {
  if (!post || typeof post !== 'object') {
    log.error('GitHub::validate post not set', post);
    return false;
  }
  if (event === 'push' && !post.repository) {
    log.error('GitHub::validate post repository not set', post);
    return false;
  }
  return true;
}
