const MAX_DELIVERIES = 1000;
const tasks = [];
const deliveryStates = new Map();
let head = 0;

export function enqueuePublisherTask(task) {
  if (task.deliveryId && deliveryStates.has(task.deliveryId)) return false;
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
  deliveryStates.delete(deliveryId);
  deliveryStates.set(deliveryId, "processed");
  let processedCount = 0;
  for (const state of deliveryStates.values()) {
    if (state === "processed") processedCount += 1;
  }
  while (processedCount > MAX_DELIVERIES) {
    const oldestProcessed = [...deliveryStates].find(([, state]) => state === "processed")[0];
    deliveryStates.delete(oldestProcessed);
    processedCount -= 1;
  }
}

export function getPendingPublisherTasks() {
  return tasks.length - head;
}

export function clearPublisherQueue() {
  tasks.length = 0;
  head = 0;
  deliveryStates.clear();
}
