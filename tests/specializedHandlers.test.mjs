import { jest } from "@jest/globals";
import {
  createHandler,
  registerSpecializedHandlers,
  specializedEvents,
} from "../src/specializedHandlers.mjs";
import { createRegistry } from "../src/eventHandlers.mjs";

describe("specializedHandlers", () => {
  test("handler sends specialized embed", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const handler = createHandler({ event: "issues", Notifier: { send } });
    await expect(
      handler({
        post: { action: "opened", repository: { full_name: "eliware/app" } },
        target: { repo: {} },
      }),
    ).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ event: "issues", embed: expect.any(Object) }),
    );
  });

  test("handler supports default options and logger", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const handler = createHandler({ event: "issues", Notifier: { send } });
    await expect(
      handler({ post: { repository: { full_name: "eliware/app" } }, target: { repo: {} } }),
    ).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ log: expect.anything() }));
    await expect(createHandler()({ post: {}, target: {} })).resolves.toBe(true);
  });

  test("handler without target is a no-op success", async () => {
    const send = jest.fn();
    await expect(
      createHandler({ event: "deployment", Notifier: { send } })({ post: {}, target: {} }),
    ).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  test("registers all specialized event types", () => {
    const registry = registerSpecializedHandlers(createRegistry());
    for (const event of specializedEvents) expect(registry.has(event)).toBe(true);
  });

  test("registers expected color for every specialized event", () => {
    const registry = { register: jest.fn() };
    registerSpecializedHandlers(registry, { Notifier: { send: jest.fn() } });
    expect(registry.register).toHaveBeenCalledTimes(specializedEvents.length);
    for (const event of specializedEvents) {
      expect(registry.register).toHaveBeenCalledWith(event, expect.any(Function));
    }
  });

  test("handler passes all notification fields and supplied logger", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const log = jest.fn();
    const post = { action: "closed", repository: { full_name: "org/repo" } };
    await createHandler({ event: "issues", Notifier: { send } })({
      post,
      target: { repo: { discordChannelId: "123456789012345678" } },
      log,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ post, log, logOutput: "", hasError: false }),
    );
  });
});
