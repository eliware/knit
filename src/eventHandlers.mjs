import { log as logger } from "@eliware/common";
import Notifier from "./notifier/send.mjs";
import __knitModule0 from "./specializedHandlers.mjs";
const { registerSpecializedHandlers } = __knitModule0;
function createRegistry({ Notifier: NotifierMod = Notifier } = {}) {
  const handlers = new Map();
  return {
    register(event, handler) {
      if (!event || typeof handler !== "function")
        throw new TypeError("Event and handler are required");
      handlers.set(event, handler);
      return this;
    },
    async dispatch({ event, post, target, deliveryId = null, log = logger }) {
      const handler = handlers.get(event) || handlers.get("*");
      if (!handler) return false;
      return handler({
        event,
        post,
        target,
        deliveryId,
        log,
      });
    },
    has(event) {
      return handlers.has(event) || handlers.has("*");
    },
    size() {
      return handlers.size;
    },
    notifier: NotifierMod,
  };
}
function createGenericHandler({ Notifier: NotifierMod = Notifier, eventName } = {}) {
  return async ({ event, post, _target, log = logger }) => {
    if (!post?.repository?.full_name) return true;
    await NotifierMod.send({
      post,
      event: eventName || event,
      logOutput: "",
      hasError: false,
      log,
    });
    return true;
  };
}
function createDefaultRegistry({ Notifier: NotifierMod = Notifier } = {}) {
  const registry = createRegistry({
    Notifier: NotifierMod,
  });
  registerSpecializedHandlers(registry, {
    Notifier: NotifierMod,
  });
  return registry.register(
    "*",
    createGenericHandler({
      Notifier: NotifierMod,
    }),
  );
}
const defaultRegistry = createDefaultRegistry();
export default createRegistry;
Object.assign(createRegistry, {
  createRegistry,
  createGenericHandler,
  createDefaultRegistry,
  defaultRegistry,
});
