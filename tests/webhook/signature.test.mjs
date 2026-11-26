import { jest } from "@jest/globals";
import __knitModule0 from "../../src/webhook/signature.mjs";
const { validateWebhookSignature } = __knitModule0;

test("rejects missing secrets or signatures", () => {
  const log = { error: jest.fn() };
  expect(() =>
    validateWebhookSignature({ body: "payload", signature: "", secret: "key", log }),
  ).toThrow("Missing secret or signature");
  expect(log.error).toHaveBeenCalledWith("Request not permitted: Missing secret or signature.");
});

test("delegates signature validation and rejects invalid signatures", () => {
  const log = { error: jest.fn() };
  const SignatureValidatorMod = { validate: jest.fn().mockReturnValue(false) };
  expect(() =>
    validateWebhookSignature({
      body: "payload",
      signature: "signature",
      secret: "key",
      log,
      SignatureValidatorMod,
    }),
  ).toThrow("Invalid signature");
  expect(SignatureValidatorMod.validate).toHaveBeenCalledWith({
    data: "payload",
    secret: "key",
    signature: "signature",
  });
  expect(log.error).toHaveBeenCalledWith("Request not permitted: Invalid signature.");
});

test("accepts a valid signature", () => {
  const SignatureValidatorMod = { validate: jest.fn().mockReturnValue(true) };
  expect(() =>
    validateWebhookSignature({
      body: "payload",
      signature: "signature",
      secret: "key",
      log: { error: jest.fn() },
      SignatureValidatorMod,
    }),
  ).not.toThrow();
});
