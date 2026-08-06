import { log as logger } from '@eliware/common';
import * as Consumer from './consumer.mjs';

let tasks = [];
let isProcessing = false;
const metrics = { queued: 0, processed: 0, succeeded: 0, failed: 0, retried: 0, duplicates: 0 };
const processedDeliveries = new Set();
const MAX_DELIVERIES = 1000;

/**
 * Queues a payload for publishing to the consumer.
 * @param {Object} params
 * @param {Object} params.payload - The payload to publish ({ raw, parsed }).
 * @param {Object} [params.log] - Logger instance to use.
 */
export function publish({ raw, parsed, event = 'push', deliveryId = null, log = logger, ConsumerMod = Consumer, maxAttempts = 3, retryDelayMs = 100 }) {
  if (deliveryId && processedDeliveries.has(deliveryId)) {
    metrics.duplicates += 1;
    log.info('[Publisher] Duplicate delivery ignored', deliveryId);
    return false;
  }
  if (deliveryId) {
    processedDeliveries.add(deliveryId);
    while (processedDeliveries.size > MAX_DELIVERIES) processedDeliveries.delete(processedDeliveries.values().next().value);
  }
  metrics.queued += 1;
  log.info('[Publisher] Queuing payload for publish');
  tasks.push({ raw, parsed, event, deliveryId, log, maxAttempts: Math.max(1, maxAttempts), retryDelayMs });
  setImmediate(() => processTasks(ConsumerMod));
}

/**
 * Processes all queued publish tasks.
 * @private
 */
async function processTasks(ConsumerMod = Consumer) {
  if (isProcessing || tasks.length === 0) return;
  isProcessing = true;
  while (tasks.length > 0) {
    const { raw, parsed, event, deliveryId, log = logger, maxAttempts, retryDelayMs } = tasks.shift();
    metrics.processed += 1;
    let succeeded = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        log.info('[Publisher] Sending payload to Consumer', { attempt, maxAttempts, deliveryId });
        succeeded = await ConsumerMod.consume({ message: { raw, parsed, event, deliveryId }, log });
        if (succeeded) break;
        throw new Error('Consumer returned false');
      } catch (err) {
        if (attempt < maxAttempts) {
          metrics.retried += 1;
          const warn = typeof log.warn === 'function' ? log.warn.bind(log) : log.info.bind(log);
          warn('[Publisher] Consumer failed; retrying', { attempt, maxAttempts, deliveryId });
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        } else {
          metrics.failed += 1;
          log.error('[Publisher] Error sending to Consumer:', err);
        }
      }
    }
    if (succeeded) metrics.succeeded += 1;
  }
  isProcessing = false;
}

/**
 * Resets the publisher's internal state. For testing purposes only.
 * @private
 */
export function getPublisherMetrics() {
  return { ...metrics, pending: tasks.length, processing: isProcessing };
}

export function _resetPublisherState() {
  tasks = [];
  isProcessing = false;
  processedDeliveries.clear();
  Object.keys(metrics).forEach(key => { metrics[key] = 0; });
}
