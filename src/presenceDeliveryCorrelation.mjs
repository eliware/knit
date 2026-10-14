export function createPresenceDeliveryCorrelation() {
  const activeDeliveries = new Map();
  let anonymousDeliveries = 0;
  return {
    begin(deliveryId) {
      if (deliveryId == null) anonymousDeliveries += 1;
      else activeDeliveries.set(deliveryId, (activeDeliveries.get(deliveryId) || 0) + 1);
    },
    matches(deliveryId) {
      return deliveryId == null || activeDeliveries.size === 0 || activeDeliveries.has(deliveryId);
    },
    end(deliveryId) {
      if (deliveryId == null) {
        anonymousDeliveries = Math.max(0, anonymousDeliveries - 1);
        return;
      }
      const count = activeDeliveries.get(deliveryId) || 0;
      if (count <= 1) activeDeliveries.delete(deliveryId);
      else activeDeliveries.set(deliveryId, count - 1);
    },
    reset() {
      activeDeliveries.clear();
      anonymousDeliveries = 0;
    },
  };
}
