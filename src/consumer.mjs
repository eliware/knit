import { log as logger } from '@eliware/common';
import * as Repo from './repo.mjs';
import * as GitHub from './gitHub.mjs';
import * as EventRouter from './eventRouter.mjs';
import * as EventHandlers from './eventHandlers.mjs';

/**
 * Consumes a webhook message and updates the corresponding repository.
 * @param {Object} params
 * @param {Object} params.message - The message object ({ raw, parsed }).
 * @param {Object} [params.log] - Logger instance to use.
 * @param {Object} [params.Repo] - Optional Repo module for testing/mocking.
 * @param {Object} [params.GitHub] - Optional GitHub module for testing/mocking.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function consume({ message, log = logger, Repo: RepoMod = Repo, GitHub: GitHubMod = GitHub, Router: RouterMod = EventRouter, Handlers: HandlersMod = EventHandlers.defaultRegistry }) {
  // message: { raw, parsed }
  const post = message.parsed;
  const event = message.event || 'push';
  if (!GitHubMod.validate({ post, event, log })) {
    log.error('[Consumer] GitHub validation failed');
    return false;
  }
  const target = await RouterMod.resolveEventTarget({ post, RepoMod, log });
  if (target.ignored) {
    if (target.kind === 'repository') log.error('[Consumer] Repo not found:', target.name);
    else log.info('[Consumer] Event ignored: no configured target', target.name);
    return false;
  }
  if (!post.repository) {
    log.info('[Consumer] Organization-level event routed to fallback repository', target.name);
    return await HandlersMod.dispatch({ event, post, target, deliveryId: message.deliveryId, log });
  }
  if (event !== 'push') {
    log.info('[Consumer] Non-push event routed for specialized handling', event, target.name);
    return await HandlersMod.dispatch({ event, post, target, deliveryId: message.deliveryId, log });
  }
  const updated = await target.repo.update({ body: post, event, deliveryId: message.deliveryId, log });
  if (!updated) {
    log.error('[Consumer] Repo update failed');
    return false;
  }
  log.info('[Consumer] Repo updated successfully');
  return true;
}
