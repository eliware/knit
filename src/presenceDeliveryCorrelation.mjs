export function createPresenceDeliveryCorrelation() {
  let activeDelivery;
  return {
    begin(deliveryId) {
      activeDelivery = deliveryId ?? activeDelivery;
    },
    matches(deliveryId) {
      return deliveryId == null || activeDelivery == null || deliveryId === activeDelivery;
    },
    reset() {
      activeDelivery = undefined;
    },
  };
}
