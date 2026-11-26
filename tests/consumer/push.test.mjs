import { jest } from "@jest/globals";
import routePushEvent from "../../src/consumer/push.mjs";

test("routes push context to repository processing", async () => {
  const message = {
    parsed: { repository: { full_name: "eliware/knit" } },
    deliveryId: "delivery-1",
  };
  const log = { info: jest.fn() };
  const RepoMod = {};
  const RouterMod = {};
  const presence = {};
  const processPush = jest.fn().mockResolvedValue(true);

  await expect(
    routePushEvent({ message, log, RepoMod, RouterMod, presence, processPush }),
  ).resolves.toBe(true);
  expect(processPush).toHaveBeenCalledWith({
    post: message.parsed,
    deliveryId: "delivery-1",
    log,
    RepoMod,
    RouterMod,
    presence,
    repository: "eliware/knit",
  });
});
