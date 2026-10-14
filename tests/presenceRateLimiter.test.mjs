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
