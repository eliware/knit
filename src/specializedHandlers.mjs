import { log as logger } from "@eliware/common";
import * as Notifier from "./notifier/send.mjs";
import { COLORS, createEmbed } from "./specializedEventEmbed.mjs";
export { createEmbed } from "./specializedEventEmbed.mjs";

export function createHandler({ event, Notifier: NotifierMod = Notifier } = {}) {
  return async ({ post, _target, log = logger }) => {
    if (!post?.repository?.full_name) return true;
    await NotifierMod.send({
      post,
      event,
      embed: createEmbed({ event, post }),
      logOutput: "",
      hasError: false,
      log,
    });
    return true;
  };
}

export function registerSpecializedHandlers(registry, { Notifier: NotifierMod = Notifier } = {}) {
  for (const event of Object.keys(COLORS))
    registry.register(event, createHandler({ event, Notifier: NotifierMod }));
  return registry;
}

export const specializedEvents = Object.keys(COLORS);
