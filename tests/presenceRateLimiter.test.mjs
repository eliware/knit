import { jest } from "@jest/globals";
import { createPresenceRateLimiter } from "../src/presenceRateLimiter.mjs";

test("skips duplicate presence and waits when the update bucket is full", async () => {
  const setPresence = jest.fn().mockResolvedValue(undefined);
  let time = 0;
  const send = createPresenceRateLimiter({
    client: { user: { setPresence } },
    now: () => time,
    setTimeoutFn: (resolve, delay) => {
      time += delay;
      resolve();
    },
    log: {},
  });
  for (let i = 0; i < 5; i += 1) await send({ status: `online-${i}` });
  await send({ status: "online-5" });
  await send({ status: "online-5" });
  expect(setPresence).toHaveBeenCalledTimes(6);
});

test("returns success without a client and logs a failed update", async () => {
  const warn = jest.fn();
  const error = new Error("offline");
  const send = createPresenceRateLimiter({
    client: { user: { setPresence: jest.fn().mockRejectedValue(error) } },
    now: () => 0,
    setTimeoutFn: setTimeout,
    log: { warn },
  });
  expect(
    await createPresenceRateLimiter({ now: () => 0, setTimeoutFn: setTimeout, log: {} })({}),
  ).toBe(true);
  expect(await send({ status: "offline" })).toBe(false);
  expect(warn).toHaveBeenCalledWith("[Discord] Failed to update presence", error);
});

test("serializes concurrent updates while the rate limit is full", async () => {
  const waits = [];
  const updates = [];
  let time = 0;
  const send = createPresenceRateLimiter({
    client: { user: { setPresence: jest.fn(async (presence) => updates.push(presence)) } },
    now: () => time,
    setTimeoutFn: (resolve, delay) => waits.push({ resolve, delay }),
    log: {},
  });
  for (let index = 0; index < 5; index += 1) await send({ status: `online-${index}` });

  const sixth = send({ status: "online-5" });
  const seventh = send({ status: "online-6" });
  await Promise.resolve();
  await Promise.resolve();
  expect(waits).toHaveLength(1);
  expect(waits[0].delay).toBe(20_000);

  time = 20_000;
  waits[0].resolve();
  await Promise.all([sixth, seventh]);
  expect(updates).toHaveLength(7);
});

test("allows later updates after an internal queue error", async () => {
  let shouldFail = true;
  const send = createPresenceRateLimiter({
    client: { user: { setPresence: jest.fn().mockResolvedValue(undefined) } },
    now: () => {
      if (shouldFail) {
        shouldFail = false;
        throw new Error("clock failed");
      }
      return 0;
    },
    setTimeoutFn: setTimeout,
    log: {},
  });
  await expect(send({ status: "first" })).rejects.toThrow("clock failed");
  await expect(send({ status: "next" })).resolves.toBe(true);
});
