import crypto from 'crypto';

/**
 * Validates a GitHub webhook signature.
 * @param {Object} params
 * @param {string} params.data - The raw request body.
 * @param {string} params.secret - The webhook secret.
 * @param {string} params.signature - The signature from the header.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ data, secret, signature }) {
  if (!secret || !signature) return false;
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(data).digest('hex');
  return expectedSignature === signature;
}
