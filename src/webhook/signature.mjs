import SignatureValidator from "../signatureValidator.mjs";

function validateWebhookSignature({
  body,
  signature,
  secret,
  log,
  SignatureValidatorMod = SignatureValidator,
}) {
  if (!secret || !signature) {
    log.error("Request not permitted: Missing secret or signature.");
    throw new Error("Request not permitted: Missing secret or signature.");
  }
  if (!SignatureValidatorMod.validate({ data: body, secret, signature })) {
    log.error("Request not permitted: Invalid signature.");
    throw new Error("Request not permitted: Invalid signature.");
  }
}

export default validateWebhookSignature;
Object.assign(validateWebhookSignature, { validateWebhookSignature });
