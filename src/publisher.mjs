import { log as logger } from "@eliware/common";
import * as Consumer from "./consumer.mjs";
import { enqueuePublisherTask, MAX_PENDING_PUBLISHER_TASKS } from "./publisherQueue.mjs";
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
  const queued = enqueuePublisherTask(task);
  if (queued === null) {
    const error = Object.assign(new Error("Publisher queue is full"), {
      code: "PUBLISHER_QUEUE_FULL",
    });
    activeLog.error?.("[Publisher] Pending task limit reached", {
      maxPending: MAX_PENDING_PUBLISHER_TASKS,
    });
    throw error;
  }
  if (!queued) {
    recordPublisherMetric("duplicates");
    activeLog.info("[Publisher] Duplicate request ignored", deliveryId);
    return false;
  }
  recordPublisherMetric("queued");
  activeLog.info("[Publisher] Queuing payload for publish");
  schedule(() => processTasks(ConsumerMod));
  return true;
}
