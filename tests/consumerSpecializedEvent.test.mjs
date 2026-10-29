import { jest } from "@jest/globals";
import { processSpecializedEvent } from "../src/consumerSpecializedEvent.mjs";

test("routes a specialized event with concise correlation fields", async () => {
  const log = { info: jest.fn() };
  const target = { name: "eliware/knit" };
  const post = { ref: "refs/heads/main" };
  const presence = { terminal: jest.fn(), end: jest.fn() };
  const HandlersMod = { dispatch: jest.fn().mockResolvedValue(true) };
  const options = {
    event: "issues",
    post,
    target,
    deliveryId: "delivery-1",
    repository: "eliware/knit",
    log,
    HandlersMod,
    presence,
  };

  await expect(processSpecializedEvent(options)).resolves.toBe(true);
  expect(log.info).toHaveBeenCalledWith(
    "[Consumer] Non-push event routed for specialized handling",
    {
      event: "issues",
      repository: "eliware/knit",
      ref: "refs/heads/main",
      deliveryId: "delivery-1",
    },
  );
  expect(HandlersMod.dispatch).toHaveBeenCalledWith({
    event: "issues",
    post,
    target,
    deliveryId: "delivery-1",
    log,
  });
  expect(presence.terminal).toHaveBeenCalledWith("completed eliware/knit", false, "delivery-1");
});
