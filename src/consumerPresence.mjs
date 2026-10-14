export async function finishConsumerPresence({
  presence,
  text,
  deliveryId,
  failed = false,
  neutral = false,
}) {
  await (neutral
    ? presence?.neutral?.(text, deliveryId)
    : presence?.terminal(text, failed, deliveryId));
  presence?.end();
}
