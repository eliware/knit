import __knitModule0 from "./consumerOutcomePresence.mjs";
const { finishConsumerOutcome } = __knitModule0;
async function processSpecializedEvent({
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
  const result = await HandlersMod.dispatch({
    event,
    post,
    target,
    deliveryId,
    log,
  });
  await finishConsumerOutcome({
    presence,
    outcome: {
      type: "specialized",
      result,
    },
    repository,
    deliveryId,
  });
  return result;
}
export default processSpecializedEvent;
Object.assign(processSpecializedEvent, {
  processSpecializedEvent,
});
