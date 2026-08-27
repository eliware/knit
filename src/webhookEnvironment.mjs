const commitSha = /^[0-9a-f]{40}$/i;

export function createWebhookEnvironment({ body = {}, event, deliveryId } = {}) {
  return {
    KNIT_COMMIT_SHA: commitSha.test(body.after || '') ? body.after : '',
    KNIT_REPOSITORY: String(body.repository?.full_name || ''),
    KNIT_REF: String(body.ref || ''),
    KNIT_EVENT: String(event || ''),
    KNIT_DELIVERY_ID: String(deliveryId || ''),
  };
}
