import crypto from "crypto";

/**
 * Validates a GitHub webhook signature.
 * @param {Object} params
 * @param {string} params.data - The raw request body.
 * @param {string} params.secret - The webhook secret.
 * @param {string} params.signature - The signature from the header.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ data, secret, signature }) {
  if (!secret || typeof signature !== "string" || !/^sha256=[\da-f]{64}$/iu.test(signature))
    return false;
  const expected = crypto.createHmac("sha256", secret).update(data).digest();
  const supplied = Buffer.from(signature.slice("sha256=".length), "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
}
