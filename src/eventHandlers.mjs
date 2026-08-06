import { log as logger } from '@eliware/common';
import * as Notifier from './notifier.mjs';
import { registerSpecializedHandlers } from './specializedHandlers.mjs';

/**
 * Creates the default event handler registry.
 * @param {Object} [params]
 * @param {Object} [params.Notifier] - Injectable notifier module.
 * @returns {{register: Function, dispatch: Function}}
 */
export function createRegistry({ Notifier: NotifierMod = Notifier } = {}) {
  const handlers = new Map();

  return {
    register(event, handler) {
      if (!event || typeof handler !== 'function') throw new TypeError('Event and handler are required');
      handlers.set(event, handler);
      return this;
    },
    async dispatch({ event, post, target, deliveryId = null, log = logger }) {
      const handler = handlers.get(event) || handlers.get('*');
      if (!handler) return false;
      return handler({ event, post, target, deliveryId, log });
    },
    has(event) {
      return handlers.has(event) || handlers.has('*');
    },
    size() {
      return handlers.size;
    },
    notifier: NotifierMod,
  };
}

/**
 * Creates a generic Discord notification handler for events without a specialized handler.
 * @param {Object} params
 * @param {Object} [params.Notifier] - Injectable notifier module.
 * @param {string} [params.eventName] - Optional fixed event name.
 * @returns {Function}
 */
export function createGenericHandler({ Notifier: NotifierMod = Notifier, eventName } = {}) {
  return async ({ event, post, target, log = logger }) => {
    const notifyUrl = target?.repo?.notify;
    if (!notifyUrl) return true;
    await NotifierMod.send({
      notifyUrl,
      post,
      event: eventName || event,
      logOutput: '',
      hasError: false,
      log,
    });
    return true;
  };
}

export function createDefaultRegistry({ Notifier: NotifierMod = Notifier } = {}) {
  const registry = createRegistry({ Notifier: NotifierMod });
  registerSpecializedHandlers(registry, { Notifier: NotifierMod });
  return registry.register('*', createGenericHandler({ Notifier: NotifierMod }));
}

export const defaultRegistry = createDefaultRegistry();
