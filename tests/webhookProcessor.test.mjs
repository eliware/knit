import { jest } from '@jest/globals';
import { createWebhookProcessor } from '../src/webhookProcessor.mjs';

describe('webhookProcessor.mjs', () => {
  const log = { info: jest.fn(), error: jest.fn() };
  let SignatureValidator;
  beforeEach(() => {
    jest.clearAllMocks();
    SignatureValidator = { validate: jest.fn() };
  });

  it('should process a valid webhook', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'shhh';
    const req = {
      rawBody: 'payload',
      body: { foo: 'bar' },
      headers: { 'x-hub-signature-256': 'sha256=abc' }
    };
    const res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    SignatureValidator.validate.mockReturnValue(true);
    const processor = createWebhookProcessor({ log, SignatureValidatorMod: SignatureValidator });
    await processor.process(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });


  it('publishes event metadata and delivery ID', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'shhh';
    const publisher = { publish: jest.fn() };
    const req = {
      rawBody: 'payload',
      body: { repository: { full_name: 'eliware/knit' } },
      headers: { 'x-hub-signature-256': 'sha256=abc', 'x-github-event': 'release', 'x-github-delivery': 'delivery-1' }
    };
    const res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    SignatureValidator.validate.mockReturnValue(true);
    const processor = createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator });
    await processor.process(req, res);
    expect(publisher.publish).toHaveBeenCalledWith(expect.objectContaining({ event: 'release', deliveryId: 'delivery-1' }));
  });

  it('defaults missing event header to push', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'shhh';
    const publisher = { publish: jest.fn() };
    const req = { rawBody: 'payload', body: { repository: {} }, headers: { 'x-hub-signature-256': 'sha256=abc' } };
    const res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    SignatureValidator.validate.mockReturnValue(true);
    await createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator }).process(req, res);
    expect(publisher.publish).toHaveBeenCalledWith(expect.objectContaining({ event: 'push', deliveryId: null }));
  });

  it('should return 400 if signature is missing', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'shhh';
    const req = {
      rawBody: 'payload',
      body: { foo: 'bar' },
      headers: {}
    };
    const res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    SignatureValidator.validate.mockReturnValue(false);
    const processor = createWebhookProcessor({ log, SignatureValidatorMod: SignatureValidator });
    await processor.process(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Webhook processing failed.');
  });
});
