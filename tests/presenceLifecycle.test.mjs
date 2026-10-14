import { jest } from "@jest/globals";
import { createPresenceLifecycle } from "../src/presenceLifecycle.mjs";

const makeLifecycle = (options = {}) => {
  const send = jest.fn().mockResolvedValue(true);
  const lifecycle = createPresenceLifecycle({
    send,
    versionPresence: () => ({ status: "idle" }),
    busyPresence: (name) => ({ name }),
    setTimeoutFn: options.setTimeoutFn || (() => ({})),
    clearTimeoutFn: options.clearTimeoutFn || jest.fn(),
  });
  return { lifecycle, send };
};

test("routes lifecycle states", async () => {
  const { lifecycle, send } = makeLifecycle();
  await lifecycle.start();
  await lifecycle.begin("first");
  await lifecycle.terminal("done");
  await lifecycle.neutral("info");
  lifecycle.end();
  expect(send).toHaveBeenCalledTimes(4);
  expect(send).toHaveBeenNthCalledWith(3, { name: "✅ done" });
  expect(send).toHaveBeenLastCalledWith({ name: "ℹ️ info" });
});

test("ignores neutral updates while idle and for stale deliveries", async () => {
  const { lifecycle, send } = makeLifecycle();
  await expect(lifecycle.neutral("idle")).resolves.toBe(false);
  await lifecycle.begin("current", "one");
  await expect(lifecycle.neutral("stale", "two")).resolves.toBe(false);
  expect(send).toHaveBeenCalledTimes(1);
});

test("ignores stale delivery updates during anonymous work", async () => {
  const { lifecycle, send } = makeLifecycle();
  await lifecycle.begin("anonymous work");
  await expect(lifecycle.terminal("stale", false, "completed-delivery")).resolves.toBe(false);
  expect(send).toHaveBeenCalledTimes(1);
});

test("schedules idle state and refuses updates while idle", async () => {
  let timer;
  const clearTimeoutFn = jest.fn();
  const { lifecycle, send } = makeLifecycle({
    setTimeoutFn: jest.fn((callback) => {
      timer = callback;
      return { unref: jest.fn() };
    }),
    clearTimeoutFn,
  });
  await expect(lifecycle.update("idle update")).resolves.toBe(false);
  await lifecycle.begin("work");
  await lifecycle.update("active update");
  lifecycle.end();
  timer();
  await lifecycle.stop();
  expect(send).toHaveBeenLastCalledWith({ status: "idle" });
  expect(clearTimeoutFn).toHaveBeenCalled();
});

test("does not restore idle state after work starts again", async () => {
  let idleTimer;
  const { lifecycle, send } = makeLifecycle({
    setTimeoutFn: (callback) => {
      idleTimer = callback;
      return {};
    },
  });
  await lifecycle.begin("first");
  lifecycle.end();
  await lifecycle.begin("second");
  idleTimer();
  expect(send).not.toHaveBeenCalledWith({ status: "idle" });
});

test("tracks terminal updates for overlapping deliveries", async () => {
  const { lifecycle, send } = makeLifecycle();
  await lifecycle.begin("first", "one");
  await lifecycle.begin("second", "two");

  await expect(lifecycle.terminal("first done", false, "one")).resolves.toBe(true);
  lifecycle.end("one");
  await expect(lifecycle.terminal("second done", false, "two")).resolves.toBe(true);
  lifecycle.end("two");
  await expect(lifecycle.terminal("stale", false, "one")).resolves.toBe(false);

  expect(send).toHaveBeenLastCalledWith({ name: "✅ second done" });
});
