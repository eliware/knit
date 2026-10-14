import { createPresenceRateLimiter } from "./presenceRateLimiter.mjs";
const IDLE_MS = 10 * 60 * 1_000;

export function createPresenceManager({
  client,
  version,
  now = () => Date.now(),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  log = console,
} = {}) {
  let idleTimer;
  let busy = 0;
  let activeDelivery;

  const versionPresence = () => ({
    activities: [{ name: `🧶 knit v${version}`, type: 4 }],
    status: "online",
  });
  const busyPresence = (text) => ({
    activities: [{ name: String(text).slice(0, 128), type: 4 }],
    status: "online",
  });

  const send = createPresenceRateLimiter({ client, now, setTimeoutFn, log });

  function scheduleIdle() {
    clearTimeoutFn(idleTimer);
    idleTimer = setTimeoutFn(() => {
      if (!busy) void send(versionPresence());
    }, IDLE_MS);
    idleTimer?.unref?.();
  }

  return {
    start() {
      return send(versionPresence());
    },
    begin(text = "busy", deliveryId = null) {
      busy += 1;
      activeDelivery = deliveryId ?? activeDelivery;
      clearTimeoutFn(idleTimer);
      return send(busyPresence(`⏳ knitting ${text}`));
    },
    update(text) {
      if (busy) return send(busyPresence(text));
      return Promise.resolve(false);
    },
    terminal(text, failed = false, deliveryId = null) {
      if (deliveryId != null && activeDelivery != null && deliveryId !== activeDelivery)
        return Promise.resolve(false);
      if (busy) return send(busyPresence(`${failed ? "❌" : "✅"} ${text}`));
      return Promise.resolve(false);
    },
    neutral(text, deliveryId = null) {
      if (deliveryId != null && activeDelivery != null && deliveryId !== activeDelivery)
        return Promise.resolve(false);
      if (busy) return send(busyPresence(`ℹ️ ${text}`));
      return Promise.resolve(false);
    },
    end() {
      busy = Math.max(0, busy - 1);
      if (!busy) {
        activeDelivery = undefined;
        scheduleIdle();
      }
    },
    stop() {
      clearTimeoutFn(idleTimer);
    },
  };
}

let activeManager;
export function setPresenceManager(manager) {
  activeManager = manager;
}
export function getPresenceManager() {
  return activeManager;
}
