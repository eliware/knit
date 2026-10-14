import { clearPublisherQueue, getPendingPublisherTasks } from "./publisherQueue.mjs";

let processing = false;
const metrics = { queued: 0, processed: 0, succeeded: 0, failed: 0, retried: 0, duplicates: 0 };

export function recordPublisherMetric(name) {
  metrics[name] += 1;
}

export function isPublisherProcessing() {
  return processing;
}

export function setPublisherProcessing(value) {
  processing = value;
}

export function getPublisherMetrics() {
  return { ...metrics, pending: getPendingPublisherTasks(), processing };
}

export function _resetPublisherState() {
  clearPublisherQueue();
  processing = false;
  Object.keys(metrics).forEach((key) => {
    metrics[key] = 0;
  });
}
