const MAX_DELIVERIES = 1000;

function createDeliveryHistory(deliveryStates) {
  const processedDeliveries = [];
  let processedHead = 0;

  function forget(deliveryId) {
    if (deliveryId) deliveryStates.delete(deliveryId);
  }

  function complete(deliveryId) {
    if (!deliveryId || !deliveryStates.has(deliveryId)) return;
    deliveryStates.set(deliveryId, "processed");
    processedDeliveries.push(deliveryId);
    if (processedDeliveries.length - processedHead > MAX_DELIVERIES) {
      deliveryStates.delete(processedDeliveries[processedHead]);
      processedDeliveries[processedHead] = undefined;
      processedHead += 1;
    }
    if (processedHead >= 256) {
      processedDeliveries.splice(0, processedHead);
      processedHead = 0;
    }
  }

  function clear() {
    processedDeliveries.length = 0;
    processedHead = 0;
  }

  return { forget, complete, clear };
}

export default createDeliveryHistory;
Object.assign(createDeliveryHistory, { createDeliveryHistory });
