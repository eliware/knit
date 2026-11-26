import { log as logger } from "@eliware/common";
import Notifier from "./notifier/send.mjs";
import __knitModule0 from "./specializedEventEmbed.mjs";
const { COLORS, createEmbed } = __knitModule0;
function createHandler({ event, Notifier: NotifierMod = Notifier } = {}) {
  return async ({ post, _target, log = logger }) => {
    if (!post?.repository?.full_name) return true;
    await NotifierMod.send({
      post,
      event,
      embed: createEmbed({
        event,
        post,
      }),
      logOutput: "",
      hasError: false,
      log,
    });
    return true;
  };
}
function registerSpecializedHandlers(registry, { Notifier: NotifierMod = Notifier } = {}) {
  for (const event of Object.keys(COLORS))
    registry.register(
      event,
      createHandler({
        event,
        Notifier: NotifierMod,
      }),
    );
  return registry;
}
const specializedEvents = Object.keys(COLORS);
export default createHandler;
Object.assign(createHandler, {
  createEmbed,
  createHandler,
  registerSpecializedHandlers,
  specializedEvents,
});
