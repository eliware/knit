import { log as logger } from "@eliware/common";
import * as Consumer from "./consumer.mjs";
import { enqueuePublisherTask } from "./publisherQueue.mjs";
import { recordPublisherMetric } from "./publisherState.mjs";
import { processTasks } from "./publisher/task-drainer.mjs";

export { processTasks };

export function publish({
  raw,
  parsed,
  event = "push",
  deliveryId = null,
  log,
  ConsumerMod = Consumer,
  schedule = setImmediate,
}) {
  const activeLog = log ?? logger;
  const task = {
    raw,
    parsed,
    event,
    deliveryId,
    ...(log ? { log } : {}),
  };
  if (!enqueuePublisherTask(task)) {
    recordPublisherMetric("duplicates");
    activeLog.info("[Publisher] Duplicate request ignored", deliveryId);
    return false;
  }
  recordPublisherMetric("queued");
  activeLog.info("[Publisher] Queuing payload for publish");
  schedule(() => processTasks(ConsumerMod));
  return true;
}
