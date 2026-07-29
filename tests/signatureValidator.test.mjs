import { jest } from '@jest/globals'; // Add this line for Jest ESM support
// Tests for src/signatureValidator.mjs
import { validate } from '../src/signatureValidator.mjs';
import crypto from 'crypto';

describe('signatureValidator.mjs', () => {
  it('should return false if secret or signature is missing', () => {
    expect(validate({ data: 'foo', secret: '', signature: '' })).toBe(false);
  });

  it('should return true if signature matches', () => {
    const secret = 'shhh';
    const data = 'payload';
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(data).digest('hex');
    expect(validate({ data, secret, signature: expected })).toBe(true);
  });

  it('should return false if signature does not match', () => {
    expect(validate({ data: 'foo', secret: 'bar', signature: 'bad' })).toBe(false);
  });
});
