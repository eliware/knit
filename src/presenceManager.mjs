import { log as logger } from "@eliware/common";
import { createPresenceRateLimiter } from "./presenceRateLimiter.mjs";
import { createPresenceLifecycle } from "./presenceLifecycle.mjs";

export function createPresenceManager({
  client,
  version,
  now = () => Date.now(),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  log = logger,
} = {}) {
  const versionPresence = () => ({
    activities: [{ name: `🧶 knit v${version}`, type: 4 }],
    status: "online",
  });
  const busyPresence = (text) => ({
    activities: [{ name: String(text).slice(0, 128), type: 4 }],
    status: "online",
  });

  const send = createPresenceRateLimiter({ client, now, setTimeoutFn, log });

  return createPresenceLifecycle({
    send,
    versionPresence,
    busyPresence,
    setTimeoutFn,
    clearTimeoutFn,
  });
}

let activeManager;
export function setPresenceManager(manager) {
  activeManager = manager;
}
export function getPresenceManager() {
  return activeManager;
}
