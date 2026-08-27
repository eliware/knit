const MAX_UPDATES = 5;
const WINDOW_MS = 20_000;
const IDLE_MS = 10 * 60 * 1_000;

export function createPresenceManager({ client, version, now = () => Date.now(), setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout, log = console } = {}) {
  const updates = [];
  let idleTimer;
  let busy = 0;
  let lastPresence;

  const versionPresence = () => ({ activities: [{ name: `🧶 knit v${version}`, type: 4 }], status: 'online' });
  const busyPresence = text => ({ activities: [{ name: String(text).slice(0, 128), type: 4 }], status: 'online' });

  async function send(presence) {
    const current = now();
    while (updates[0] <= current - WINDOW_MS) updates.shift();
    if (updates.length >= MAX_UPDATES || JSON.stringify(presence) === JSON.stringify(lastPresence)) return false;
    updates.push(current);
    lastPresence = presence;
    try {
      await client?.user?.setPresence?.(presence);
      return true;
    } catch (error) {
      log.warn?.('[Discord] Failed to update presence', error);
      return false;
    }
  }

  function scheduleIdle() {
    clearTimeoutFn(idleTimer);
    idleTimer = setTimeoutFn(() => { if (!busy) void send(versionPresence()); }, IDLE_MS);
    idleTimer?.unref?.();
  }

  return {
    start() { void send(versionPresence()); },
    begin(text = 'busy') {
      busy += 1;
      clearTimeoutFn(idleTimer);
      void send(busyPresence(text));
    },
    update(text) { if (busy) void send(busyPresence(text)); },
    end() {
      busy = Math.max(0, busy - 1);
      if (!busy) scheduleIdle();
    },
    stop() { clearTimeoutFn(idleTimer); },
  };
}

let activeManager;
export function setPresenceManager(manager) { activeManager = manager; }
export function getPresenceManager() { return activeManager; }
