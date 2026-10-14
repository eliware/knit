const MAX_UPDATES = 5;
const WINDOW_MS = 20_000;

export function createPresenceRateLimiter({ client, now, setTimeoutFn, log }) {
  const updates = [];
  let lastPresence;

  return async function send(presence) {
    const current = now();
    while (updates[0] <= current - WINDOW_MS) updates.shift();
    if (JSON.stringify(presence) === JSON.stringify(lastPresence)) return true;
    if (updates.length >= MAX_UPDATES) {
      await new Promise((resolve) => setTimeoutFn(resolve, WINDOW_MS - (current - updates[0])));
      return send(presence);
    }
    updates.push(current);
    lastPresence = presence;
    try {
      await client?.user?.setPresence?.(presence);
      return true;
    } catch (error) {
      log.warn?.("[Discord] Failed to update presence", error);
      return false;
    }
  };
}
