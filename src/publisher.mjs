import { log as logger } from "@eliware/common";
import * as Consumer from "./consumer.mjs";
import {
  completePublisherDelivery,
  dequeuePublisherTask,
  enqueuePublisherTask,
  forgetPublisherDelivery,
  getPendingPublisherTasks,
} from "./publisherQueue.mjs";
import { processPublisherTask } from "./publisherProcessor.mjs";
import {
  isPublisherProcessing,
  recordPublisherMetric,
  setPublisherProcessing,
} from "./publisherState.mjs";

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

export async function processTasks(ConsumerMod = Consumer) {
  if (isPublisherProcessing() || getPendingPublisherTasks() === 0) return;
  setPublisherProcessing(true);
  try {
    while (getPendingPublisherTasks() > 0) {
      const task = dequeuePublisherTask();
      try {
        const succeeded = await processPublisherTask({
          task,
          ConsumerMod,
          recordMetric: recordPublisherMetric,
        });
        if (succeeded) completePublisherDelivery(task.deliveryId);
        else forgetPublisherDelivery(task.deliveryId);
      } catch (error) {
        recordPublisherMetric("failed");
        forgetPublisherDelivery(task.deliveryId);
        logger.error("[Publisher] Unexpected task processing error", error);
      }
    }
  } finally {
    setPublisherProcessing(false);
  }
}
