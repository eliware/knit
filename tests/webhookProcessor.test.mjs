import { jest } from '@jest/globals';
import { createWebhookProcessor } from '../src/webhookProcessor.mjs';

describe('webhookProcessor.mjs', () => {
  const log = { info: jest.fn(), error: jest.fn() };
  let SignatureValidator;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GITHUB_WEBHOOK_SECRET = 'shhh';
    SignatureValidator = { validate: jest.fn() };
    res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
  });

  afterEach(() => delete process.env.GITHUB_WEBHOOK_SECRET);

  it('processes a valid webhook and publishes all data', async () => {
    const publisher = { publish: jest.fn() };
    const req = { rawBody: 'payload', body: { foo: 'bar' }, headers: {
      'x-hub-signature-256': 'sig', 'x-github-event': 'release', 'x-github-delivery': 'delivery-1'
    } };
    SignatureValidator.validate.mockReturnValue(true);

    await createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator }).process(req, res);

    expect(SignatureValidator.validate).toHaveBeenCalledWith({ data: 'payload', secret: 'shhh', signature: 'sig' });
    expect(publisher.publish).toHaveBeenCalledWith({ raw: 'payload', parsed: req.body, event: 'release', deliveryId: 'delivery-1', log });
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it('defaults missing event and delivery headers', async () => {
    const publisher = { publish: jest.fn() };
    SignatureValidator.validate.mockReturnValue(true);
    await createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator }).process(
      { rawBody: 'payload', body: {}, headers: { 'x-hub-signature-256': 'sig' } }, res
    );
    expect(publisher.publish).toHaveBeenCalledWith(expect.objectContaining({ event: 'push', deliveryId: null }));
  });

  it('supports default processor dependencies', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    await createWebhookProcessor().process({ rawBody: 'payload', body: {}, headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects a missing signature', async () => {
    await createWebhookProcessor({ log, SignatureValidatorMod: SignatureValidator }).process(
      { rawBody: 'payload', body: {}, headers: {} }, res
    );
    expect(SignatureValidator.validate).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith('Forbidden: Missing secret or signature.');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Webhook processing failed.');
  });

  it('rejects a missing secret', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    await createWebhookProcessor({ log, SignatureValidatorMod: SignatureValidator }).process(
      { rawBody: 'payload', body: {}, headers: { 'x-hub-signature-256': 'sig' } }, res
    );
    expect(SignatureValidator.validate).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature', async () => {
    SignatureValidator.validate.mockReturnValue(false);
    await createWebhookProcessor({ log, SignatureValidatorMod: SignatureValidator }).process(
      { rawBody: 'payload', body: {}, headers: { 'x-hub-signature-256': 'sig' } }, res
    );
    expect(log.error).toHaveBeenCalledWith('Forbidden: Invalid signature.');
  });

  it('handles publisher errors with an error message', async () => {
    const publisher = { publish: jest.fn(() => { throw new Error('publish failed'); }) };
    SignatureValidator.validate.mockReturnValue(true);
    await createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator }).process(
      { rawBody: 'payload', body: {}, headers: { 'x-hub-signature-256': 'sig' } }, res
    );
    expect(log.error).toHaveBeenCalledWith('[WebhookProcessor] Error:', 'publish failed');
  });

  it('handles thrown values without a message', async () => {
    const publisher = { publish: jest.fn(() => { throw 'failed'; }) };
    SignatureValidator.validate.mockReturnValue(true);
    await createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator }).process(
      { rawBody: 'payload', body: {}, headers: { 'x-hub-signature-256': 'sig' } }, res
    );
    expect(log.error).toHaveBeenCalledWith('[WebhookProcessor] Error:', 'failed');
  });
  delete process.env.GITHUB_WEBHOOK_SECRET;
});

test('logs basic GitHub Actions event details without payload contents', async () => {
  process.env.GITHUB_WEBHOOK_SECRET = 'shhh';
  const publisher = { publish: jest.fn() };
  const SignatureValidator = { validate: jest.fn().mockReturnValue(true) };
  const log = { info: jest.fn(), error: jest.fn() };
  const res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
  const body = {
    action: 'completed',
    repository: { full_name: 'eliware/demo' },
    workflow_run: { name: 'Node CI', status: 'completed', conclusion: 'success' },
  };
  await createWebhookProcessor({ log, publisher, SignatureValidatorMod: SignatureValidator }).process(
    { rawBody: 'payload', body, headers: { 'x-hub-signature-256': 'sig', 'x-github-event': 'workflow_run', 'x-github-delivery': 'delivery-actions' } }, res
  );
  expect(log.info).toHaveBeenCalledWith('[WebhookProcessor] GitHub event received', {
    event: 'workflow_run', deliveryId: 'delivery-actions', repository: 'eliware/demo', action: 'completed',
    ref: null, workflow: 'Node CI', status: 'completed', conclusion: 'success'
  });
});
