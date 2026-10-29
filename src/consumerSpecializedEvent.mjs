import { finishConsumerOutcome } from "./consumerOutcomePresence.mjs";

export async function processSpecializedEvent({
  event,
  post,
  target,
  deliveryId,
  repository,
  log,
  HandlersMod,
  presence,
}) {
  log.info("[Consumer] Non-push event routed for specialized handling", {
    event,
    repository,
    ref: post?.ref || null,
    deliveryId,
  });
  const result = await HandlersMod.dispatch({ event, post, target, deliveryId, log });
  await finishConsumerOutcome({
    presence,
    outcome: { type: "specialized", result },
    repository,
    deliveryId,
  });
  return result;
}
