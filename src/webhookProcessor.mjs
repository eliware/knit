import { log as logger } from '@eliware/common';
import * as SignatureValidator from './signatureValidator.mjs';
import * as Publisher from './publisher.mjs';

/**
 * Creates a webhook processor for handling GitHub webhook events.
 * @param {Object} params
 * @param {Object} [params.publisher=Publisher] - The publisher module to use.
 * @param {Object} [params.log] - Logger instance to use.
 * @param {Object} [params.SignatureValidatorMod=SignatureValidator] - The signature validator module to use.
 * @returns {Object} Webhook processor with a process method.
 */
export function createWebhookProcessor({ publisher = Publisher, log = logger, SignatureValidatorMod = SignatureValidator } = {}) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
  /**
   * Validates the GitHub webhook signature.
   * @param {Object} params
   * @param {string} params.body - The raw request body.
   * @param {string} params.signature - The signature from the header.
   * @param {string} params.secret - The webhook secret.
   * @param {Object} [params.log] - Logger instance to use.
   * @throws {Error} If the signature is missing or invalid.
   */
  function validateSignature({ body, signature, secret, log }) {
    if (!secret || !signature) {
      log.error('Forbidden: Missing secret or signature.');
      throw new Error('Forbidden: Missing secret or signature.');
    }
    if (!SignatureValidatorMod.validate({ data: body, secret, signature })) {
      log.error('Forbidden: Invalid signature.');
      throw new Error('Forbidden: Invalid signature.');
    }
  }
  return {
    /**
     * Processes an incoming webhook request.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async process(req, res) {
      try {
        const rawData = req.rawBody;
        const data = req.body;
        validateSignature({ body: rawData, signature: req.headers['x-hub-signature-256'], secret, log });
        log.info('[WebhookProcessor] Signature validated');
        const event = req.headers['x-github-event'] || 'push';
        const deliveryId = req.headers['x-github-delivery'] || null;
        const repository = data?.repository?.full_name || data?.organization?.login || 'unknown';
        const details = {
          event,
          deliveryId,
          repository,
          action: data?.action || null,
          ref: data?.ref || null,
          workflow: data?.workflow_run?.name || data?.workflow_job?.name || data?.workflow?.name || null,
          status: data?.workflow_run?.status || data?.workflow_job?.status || data?.workflow_run?.conclusion || null,
          conclusion: data?.workflow_run?.conclusion || data?.workflow_job?.conclusion || null,
        };
        log.info('[WebhookProcessor] GitHub event received', details);
        publisher.publish({
      raw: rawData,
      parsed: data,
      event,
      deliveryId,
      log
    });
        log.info('[WebhookProcessor] Published data to Publisher');
        res.sendStatus(200);
      } catch (err) {
        log.error('[WebhookProcessor] Error:', err.message || err);
        res.status(400).send('Webhook processing failed.');
      }
    }
  };
}
