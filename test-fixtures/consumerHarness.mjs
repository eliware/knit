import { jest } from "@jest/globals";

export function createConsumerHarness() {
  return {
    log: { error: jest.fn(), info: jest.fn() },
    Repo: { get: jest.fn() },
    GitHub: { validate: jest.fn().mockReturnValue(true) },
    Router: { resolveEventTarget: jest.fn() },
    Handlers: { dispatch: jest.fn() },
    message: {
      raw: "{}",
      parsed: { repository: { full_name: "foo" } },
      event: "push",
      deliveryId: "delivery-1",
    },
  };
}
