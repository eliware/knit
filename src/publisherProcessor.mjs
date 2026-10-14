import { log as logger } from "@eliware/common";

export async function processPublisherTask({ task, ConsumerMod, metrics }) {
  const { raw, parsed, event, deliveryId, log = logger, maxAttempts, retryDelayMs } = task;
  metrics.processed += 1;
  let succeeded = false;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      log.info("[Publisher] Sending payload to Consumer", { attempt, maxAttempts, deliveryId });
      succeeded = await ConsumerMod.consume({ message: { raw, parsed, event, deliveryId }, log });
      if (succeeded) break;
      throw new Error("Consumer returned false");
    } catch (err) {
      if (attempt < maxAttempts) {
        metrics.retried += 1;
        const warn = typeof log.warn === "function" ? log.warn.bind(log) : log.info.bind(log);
        warn("[Publisher] Consumer failed; retrying", { attempt, maxAttempts, deliveryId });
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        metrics.failed += 1;
        log.error("[Publisher] Error sending to Consumer:", err);
      }
    }
  }
  if (succeeded) metrics.succeeded += 1;
}
