export const MAX_PENDING_PUBLISHER_TASKS = 1000;
const MAX_DELIVERIES = 1000;
const tasks = [];
const deliveryStates = new Map();
const processedDeliveries = [];
let head = 0;
let processedHead = 0;

export function enqueuePublisherTask(task) {
  if (task.deliveryId && deliveryStates.has(task.deliveryId)) return false;
  if (getPendingPublisherTasks() >= MAX_PENDING_PUBLISHER_TASKS) return null;
  if (task.deliveryId) deliveryStates.set(task.deliveryId, "pending");
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
  if (deliveryId) deliveryStates.delete(deliveryId);
}

export function completePublisherDelivery(deliveryId) {
  if (!deliveryId || !deliveryStates.has(deliveryId)) return;
  deliveryStates.set(deliveryId, "processed");
  processedDeliveries.push(deliveryId);
  if (processedDeliveries.length - processedHead > MAX_DELIVERIES) {
    deliveryStates.delete(processedDeliveries[processedHead]);
    processedDeliveries[processedHead] = undefined;
    processedHead += 1;
  }
  if (processedHead >= 256 && processedHead * 2 >= processedDeliveries.length) {
    processedDeliveries.splice(0, processedHead);
    processedHead = 0;
  }
}

export function getPendingPublisherTasks() {
  return tasks.length - head;
}

export function clearPublisherQueue() {
  tasks.length = 0;
  head = 0;
  deliveryStates.clear();
  processedDeliveries.length = 0;
  processedHead = 0;
}
