import { jest } from "@jest/globals";
import configureErrorHandler from "../../src/app/error-handler.mjs";

test("handles malformed JSON requests", () => {
  const app = { use: jest.fn() };
  const log = { warn: jest.fn() };
  const status = jest.fn().mockReturnThis();
  const send = jest.fn();
  configureErrorHandler(app, log);
  const handler = app.use.mock.calls[0][0];

  handler({ type: "entity.parse.failed" }, {}, { status, send }, jest.fn());

  expect(log.warn).toHaveBeenCalledWith("[App] Invalid JSON request body");
  expect(status).toHaveBeenCalledWith(400);
  expect(send).toHaveBeenCalledWith("Webhook processing failed.");
});

test("passes unrelated errors to the next middleware", () => {
  const app = { use: jest.fn() };
  const next = jest.fn();
  configureErrorHandler(app, { warn: jest.fn() });
  const error = new Error("other");

  app.use.mock.calls[0][0](error, {}, {}, next);

  expect(next).toHaveBeenCalledWith(error);
});
