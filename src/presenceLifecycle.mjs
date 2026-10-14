const IDLE_MS = 10 * 60 * 1_000;
import { createPresenceDeliveryCorrelation } from "./presenceDeliveryCorrelation.mjs";

export function createPresenceLifecycle({
  send,
  versionPresence,
  busyPresence,
  setTimeoutFn,
  clearTimeoutFn,
}) {
  let idleTimer;
  let busy = 0;
  const deliveryCorrelation = createPresenceDeliveryCorrelation();

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
      deliveryCorrelation.begin(deliveryId);
      clearTimeoutFn(idleTimer);
      return send(busyPresence(`⏳ knitting ${text}`));
    },
    update(text) {
      if (busy) return send(busyPresence(text));
      return Promise.resolve(false);
    },
    terminal(text, failed = false, deliveryId = null) {
      if (!deliveryCorrelation.matches(deliveryId) || !busy) return Promise.resolve(false);
      return send(busyPresence(`${failed ? "❌" : "✅"} ${text}`));
    },
    neutral(text, deliveryId = null) {
      if (!deliveryCorrelation.matches(deliveryId) || !busy) return Promise.resolve(false);
      return send(busyPresence(`ℹ️ ${text}`));
    },
    end(deliveryId = null) {
      if (!deliveryCorrelation.end(deliveryId)) return;
      busy -= 1;
      if (!busy) {
        deliveryCorrelation.reset();
        scheduleIdle();
      }
    },
    stop() {
      clearTimeoutFn(idleTimer);
    },
  };
}
