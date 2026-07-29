import { log as logger } from '@eliware/common';
import * as Repo from './repo.mjs';
import * as GitHub from './gitHub.mjs';

/**
 * Consumes a webhook message and updates the corresponding repository.
 * @param {Object} params
 * @param {Object} params.message - The message object ({ raw, parsed }).
 * @param {Object} [params.log] - Logger instance to use.
 * @param {Object} [params.Repo] - Optional Repo module for testing/mocking.
 * @param {Object} [params.GitHub] - Optional GitHub module for testing/mocking.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function consume({ message, log = logger, Repo: RepoMod = Repo, GitHub: GitHubMod = GitHub }) {
  // message: { raw, parsed }
  const post = message.parsed;
  if (!GitHubMod.validate({ post, log })) {
    log.error('[Consumer] GitHub validation failed');
    return false;
  }
  const repo = await RepoMod.get({ name: post.repository.full_name, log });
  if (!repo) {
    log.error('[Consumer] Repo not found:', post.repository.full_name);
    return false;
  }
  const updated = await repo.update({ body: post, log });
  if (!updated) {
    log.error('[Consumer] Repo update failed');
    return false;
  }
  log.info('[Consumer] Repo updated successfully');
  return true;
}
