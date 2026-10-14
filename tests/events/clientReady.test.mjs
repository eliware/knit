import { jest } from "@jest/globals";
import clientReady from "../../src/events/clientReady.mjs";

test("logs when the Discord client is ready", () => {
  const context = { log: { info: jest.fn() } };

  clientReady(context);

  expect(context.log.info).toHaveBeenCalledWith("Discord client is ready");
});
