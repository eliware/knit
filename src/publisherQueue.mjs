const MAX_DELIVERIES = 1000;
const tasks = [];
const processedDeliveries = new Set();
let head = 0;

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
  if (head >= tasks.length) return undefined;
  const task = tasks[head];
  tasks[head] = undefined;
  head += 1;
  if (head >= 64 && head * 2 >= tasks.length) {
    tasks.splice(0, head);
    head = 0;
  }
  return task;
}

export function forgetPublisherDelivery(deliveryId) {
  if (deliveryId) processedDeliveries.delete(deliveryId);
}

export function getPendingPublisherTasks() {
  return tasks.length - head;
}

export function clearPublisherQueue() {
  tasks.length = 0;
  head = 0;
  processedDeliveries.clear();
}
