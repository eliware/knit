import { jest } from "@jest/globals";
import __knitModule0 from "../src/consumerSpecializedEvent.mjs";
const { processSpecializedEvent } = __knitModule0;

test("propagates specialized handler errors without finalizing presence", async () => {
  const error = new Error("handler failed");
  const presence = { terminal: jest.fn(), end: jest.fn() };
  const options = {
    event: "issues",
    post: {},
    target: {},
    deliveryId: "delivery-1",
    repository: "eliware/knit",
    log: { info: jest.fn() },
    HandlersMod: { dispatch: jest.fn().mockRejectedValue(error) },
    presence,
  };

  await expect(processSpecializedEvent(options)).rejects.toBe(error);
  expect(presence.terminal).not.toHaveBeenCalled();
  expect(presence.end).not.toHaveBeenCalled();
});
