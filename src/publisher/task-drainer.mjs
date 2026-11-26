import { log as logger } from "@eliware/common";
import Consumer from "../consumer.mjs";
import __knitModule0 from "../publisherQueue.mjs";
import __knitModule1 from "../publisherProcessor.mjs";
import __knitModule2 from "../publisherState.mjs";
const {
  completePublisherDelivery,
  dequeuePublisherTask,
  forgetPublisherDelivery,
  getPendingPublisherTasks,
} = __knitModule0;
const { processPublisherTask } = __knitModule1;
const { isPublisherProcessing, recordPublisherMetric, setPublisherProcessing } = __knitModule2;
async function processTasks(ConsumerMod = Consumer) {
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
export default processTasks;
Object.assign(processTasks, {
  processTasks,
});
