import { log as logger } from "@eliware/common";
import __knitModule0 from "./presenceRateLimiter.mjs";
import __knitModule1 from "./presenceLifecycle.mjs";
const { createPresenceRateLimiter } = __knitModule0;
const { createPresenceLifecycle } = __knitModule1;
function createPresenceManager({
  client,
  version,
  now = () => Date.now(),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  log = logger,
} = {}) {
  const versionPresence = () => ({
    activities: [
      {
        name: `🧶 knit v${version}`,
        type: 4,
      },
    ],
    status: "online",
  });
  const busyPresence = (text) => ({
    activities: [
      {
        name: String(text).slice(0, 128),
        type: 4,
      },
    ],
    status: "online",
  });
  const send = createPresenceRateLimiter({
    client,
    now,
    setTimeoutFn,
    log,
  });
  return createPresenceLifecycle({
    send,
    versionPresence,
    busyPresence,
    setTimeoutFn,
    clearTimeoutFn,
    log,
  });
}
let activeManager;
function setPresenceManager(manager) {
  activeManager = manager;
}
function getPresenceManager() {
  return activeManager;
}
export default createPresenceManager;
Object.assign(createPresenceManager, {
  createPresenceManager,
  setPresenceManager,
  getPresenceManager,
});
