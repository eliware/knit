import { log as logger } from "@eliware/common";

export async function processPublisherTask({ task, ConsumerMod, recordMetric }) {
  const { raw, parsed, event, deliveryId, log = logger, maxAttempts, retryDelayMs } = task;
  recordMetric("processed");
  let succeeded = false;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      log.info("[Publisher] Sending payload to Consumer", { attempt, maxAttempts, deliveryId });
      succeeded = await ConsumerMod.consume({ message: { raw, parsed, event, deliveryId }, log });
      if (succeeded) break;
      throw new Error("Consumer returned false");
    } catch (err) {
      if (attempt < maxAttempts) {
        recordMetric("retried");
        const warn = typeof log.warn === "function" ? log.warn.bind(log) : log.info.bind(log);
        warn("[Publisher] Consumer failed; retrying", { attempt, maxAttempts, deliveryId });
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        recordMetric("failed");
        log.error("[Publisher] Error sending to Consumer:", err);
      }
    }
  }
  if (succeeded) recordMetric("succeeded");
  return succeeded;
}
