import { log as logger } from '@eliware/common';
import * as Repo from './repo.mjs';
import * as GitHub from './gitHub.mjs';
import * as EventRouter from './eventRouter.mjs';
import * as EventHandlers from './eventHandlers.mjs';
import { getPresenceManager } from './presenceManager.mjs';

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
  const presence = getPresenceManager();
  const repository = post?.repository?.full_name || 'webhook';
  presence?.begin(`📨 received ${repository}`);
  if (!GitHubMod.validate({ post, event, log })) {
    log.error('[Consumer] GitHub validation failed');
    presence?.end();
    return false;
  }
  presence?.update(`🧭 routing ${repository}`);
  const routerOptions = { post, RepoMod, log };
  if (RepoMod.targetLoader) routerOptions.targetLoader = RepoMod.targetLoader;
  const target = await RouterMod.resolveEventTarget(routerOptions);
  if (target.ignored) {
    if (target.kind === 'repository') log.error('[Consumer] Repo not found:', target.name);
    else log.info('[Consumer] Event ignored: no configured target', target.name);
    presence?.end();
    return false;
  }
  presence?.update(`📄 loading ${repository}`);
  if (event !== 'push') {
    log.info('[Consumer] Non-push event routed for specialized handling', event, target.name);
    const result = await HandlersMod.dispatch({ event, post, target, deliveryId: message.deliveryId, log });
    presence?.update(`${result ? '✅ completed' : '❌ failed'} ${repository}`);
    presence?.end();
    return result;
  }
  const updated = await target.repo.update({ body: post, event, deliveryId: message.deliveryId, log });
  if (!updated) {
    presence?.update(`❌ failed ${repository}`);
    log.error('[Consumer] Repo update failed');
    return false;
  }
  presence?.update(`✅ completed ${repository}`);
  log.info('[Consumer] Repo updated successfully');
  return true;
}
