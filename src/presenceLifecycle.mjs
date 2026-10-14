const IDLE_MS = 10 * 60 * 1_000;

export function createPresenceLifecycle({
  send,
  versionPresence,
  busyPresence,
  setTimeoutFn,
  clearTimeoutFn,
}) {
  let idleTimer;
  let busy = 0;
  let activeDelivery;

  function scheduleIdle() {
    clearTimeoutFn(idleTimer);
    idleTimer = setTimeoutFn(() => {
      if (!busy) void send(versionPresence());
    }, IDLE_MS);
    idleTimer?.unref?.();
  }

  function matchesDelivery(deliveryId) {
    return deliveryId == null || activeDelivery == null || deliveryId === activeDelivery;
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
      if (!matchesDelivery(deliveryId) || !busy) return Promise.resolve(false);
      return send(busyPresence(`${failed ? "❌" : "✅"} ${text}`));
    },
    neutral(text, deliveryId = null) {
      if (!matchesDelivery(deliveryId) || !busy) return Promise.resolve(false);
      return send(busyPresence(`ℹ️ ${text}`));
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
