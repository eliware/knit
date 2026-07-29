import { log as logger } from '@eliware/common';
import * as Consumer from './consumer.mjs';

let tasks = [];
let isProcessing = false;

/**
 * Queues a payload for publishing to the consumer.
 * @param {Object} params
 * @param {Object} params.payload - The payload to publish ({ raw, parsed }).
 * @param {Object} [params.log] - Logger instance to use.
 */
export function publish({ raw, parsed, log = logger, ConsumerMod = Consumer }) {
  log.info('[Publisher] Queuing payload for publish');
  tasks.push({ raw, parsed, log });
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
    const { raw, parsed, log = logger } = tasks.shift();
    try {
      log.info('[Publisher] Sending payload to Consumer');
      await ConsumerMod.consume({ message: { raw, parsed }, log });
    } catch (err) {
      log.error('[Publisher] Error sending to Consumer:', err);
    }
  }
  isProcessing = false;
}

/**
 * Resets the publisher's internal state. For testing purposes only.
 * @private
 */
export function _resetPublisherState() {
  tasks = [];
  isProcessing = false;
}
