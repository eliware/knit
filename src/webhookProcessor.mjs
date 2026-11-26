import { log as logger } from "@eliware/common";
import Publisher from "./publisher.mjs";
import __knitModule0 from "./webhookEventDetails.mjs";
import __knitModule1 from "./webhook/signature.mjs";
const { projectWebhookEventDetails } = __knitModule0;
const { validateWebhookSignature } = __knitModule1;
function createWebhookProcessor({
  publisher = Publisher,
  log = logger,
  SignatureValidatorMod,
} = {}) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
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
        validateWebhookSignature({
          body: rawData,
          signature: req.headers["x-hub-signature-256"],
          secret,
          log,
          SignatureValidatorMod,
        });
        log.info("[WebhookProcessor] Signature validated");
        const event = req.headers["x-github-event"] || "push";
        const deliveryId = req.headers["x-github-delivery"] || null;
        const details = projectWebhookEventDetails({
          data,
          event,
          deliveryId,
        });
        log.info("[WebhookProcessor] GitHub event received", details);
        publisher.publish({
          raw: rawData,
          parsed: data,
          event,
          deliveryId,
          log,
        });
        log.info("[WebhookProcessor] Published data to Publisher");
        res.sendStatus(200);
      } catch (err) {
        log.error("[WebhookProcessor] Error:", err.message || err);
        const status = err?.code === "PUBLISHER_QUEUE_FULL" ? 503 : 400;
        res.status(status).send("Webhook processing failed.");
      }
    },
  };
}
export default createWebhookProcessor;
Object.assign(createWebhookProcessor, {
  createWebhookProcessor,
});
