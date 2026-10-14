export async function finishConsumerPresence({
  presence,
  text,
  deliveryId,
  failed = false,
  neutral = false,
}) {
  try {
    await (neutral
      ? presence?.neutral?.(text, deliveryId)
      : presence?.terminal(text, failed, deliveryId));
  } catch {
    return;
  } finally {
    try {
      await presence?.end(deliveryId);
    } catch {}
  }
}
