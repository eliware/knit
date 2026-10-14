import { log as logger } from "@eliware/common";

export async function processPublisherTask({ task, ConsumerMod, recordMetric }) {
  const { raw, parsed, event, deliveryId, log = logger } = task;
  recordMetric("processed");
  try {
    log.info("[Publisher] Sending payload to Consumer", { deliveryId });
    const succeeded = await ConsumerMod.consume({
      message: { raw, parsed, event, deliveryId },
      log,
    });
    if (!succeeded) throw new Error("Consumer returned false");
    recordMetric("succeeded");
    return true;
  } catch (error) {
    recordMetric("failed");
    log.error("[Publisher] Error sending to Consumer:", error);
    return false;
  }
}
