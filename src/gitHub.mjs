import { log as logger } from '@eliware/common';

/**
 * Validates a GitHub webhook payload.
 * @param {Object} params
 * @param {Object} params.post - The webhook payload.
 * @param {Object} [params.log] - Logger instance to use.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ post, log = logger }) {
  if (!post || !post.repository) {
    log.error('GitHub::validate post repository not set', post);
    return false;
  }
  return true;
}
