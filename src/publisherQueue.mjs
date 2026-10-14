const MAX_DELIVERIES = 1000;
const tasks = [];
const processedDeliveries = new Set();

export function enqueuePublisherTask(task) {
  if (task.deliveryId && processedDeliveries.has(task.deliveryId)) return false;
  if (task.deliveryId) {
    processedDeliveries.add(task.deliveryId);
    while (processedDeliveries.size > MAX_DELIVERIES)
      processedDeliveries.delete(processedDeliveries.values().next().value);
  }
  tasks.push(task);
  return true;
}

export function dequeuePublisherTask() {
  return tasks.shift();
}

export function getPendingPublisherTasks() {
  return tasks.length;
}

export function clearPublisherQueue() {
  tasks.length = 0;
  processedDeliveries.clear();
}
