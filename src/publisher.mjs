import { log as logger } from "@eliware/common";
import * as Consumer from "./consumer.mjs";
import {
  clearPublisherQueue,
  dequeuePublisherTask,
  enqueuePublisherTask,
  getPendingPublisherTasks,
} from "./publisherQueue.mjs";
import { processPublisherTask } from "./publisherProcessor.mjs";

let isProcessing = false;
const metrics = { queued: 0, processed: 0, succeeded: 0, failed: 0, retried: 0, duplicates: 0 };

export function publish({
  raw,
  parsed,
  event = "push",
  deliveryId = null,
  log,
  ConsumerMod = Consumer,
  maxAttempts = 3,
  retryDelayMs = 100,
}) {
  const activeLog = log ?? logger;
  const task = {
    raw,
    parsed,
    event,
    deliveryId,
    ...(log ? { log } : {}),
    maxAttempts: Math.max(1, maxAttempts),
    retryDelayMs,
  };
  if (!enqueuePublisherTask(task)) {
    metrics.duplicates += 1;
    activeLog.info("[Publisher] Duplicate delivery ignored", deliveryId);
    return false;
  }
  metrics.queued += 1;
  activeLog.info("[Publisher] Queuing payload for publish");
  setImmediate(() => processTasks(ConsumerMod));
}

export async function processTasks(ConsumerMod = Consumer) {
  if (isProcessing || getPendingPublisherTasks() === 0) return;
  isProcessing = true;
  while (getPendingPublisherTasks() > 0)
    await processPublisherTask({ task: dequeuePublisherTask(), ConsumerMod, metrics });
  isProcessing = false;
}

export function getPublisherMetrics() {
  return { ...metrics, pending: getPendingPublisherTasks(), processing: isProcessing };
}

export function _resetPublisherState() {
  clearPublisherQueue();
  isProcessing = false;
  Object.keys(metrics).forEach((key) => {
    metrics[key] = 0;
  });
}
