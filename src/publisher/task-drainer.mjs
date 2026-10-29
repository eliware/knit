import { log as logger } from "@eliware/common";
import * as Consumer from "../consumer.mjs";
import {
  completePublisherDelivery,
  dequeuePublisherTask,
  forgetPublisherDelivery,
  getPendingPublisherTasks,
} from "../publisherQueue.mjs";
import { processPublisherTask } from "../publisherProcessor.mjs";
import {
  isPublisherProcessing,
  recordPublisherMetric,
  setPublisherProcessing,
} from "../publisherState.mjs";

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
