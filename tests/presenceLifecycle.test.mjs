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

test("routes lifecycle states and ignores results for a stale delivery", async () => {
  const { lifecycle, send } = makeLifecycle();
  await lifecycle.start();
  await lifecycle.begin("first", "one");
  await lifecycle.begin("second", "two");
  await lifecycle.terminal("stale", true, "one");
  await lifecycle.neutral("stale", "one");
  await lifecycle.terminal("done", false, "two");
  await lifecycle.neutral("ignored", "two");
  lifecycle.end();
  lifecycle.end();
  expect(send).toHaveBeenCalledTimes(5);
  expect(send).toHaveBeenNthCalledWith(4, { name: "✅ done" });
  expect(send).toHaveBeenLastCalledWith({ name: "ℹ️ ignored" });
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
