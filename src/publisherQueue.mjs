import __knitModule0 from "./publisher/delivery-history.mjs";
const { createDeliveryHistory } = __knitModule0;
const MAX_PENDING_PUBLISHER_TASKS = 1000;
const tasks = [];
const deliveryStates = new Map();
let head = 0;
const deliveryHistory = createDeliveryHistory(deliveryStates);
function enqueuePublisherTask(task) {
  if (task.deliveryId && deliveryStates.has(task.deliveryId)) return false;
  if (getPendingPublisherTasks() >= MAX_PENDING_PUBLISHER_TASKS) return null;
  if (task.deliveryId) deliveryStates.set(task.deliveryId, "pending");
  tasks.push(task);
  return true;
}
function dequeuePublisherTask() {
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
function forgetPublisherDelivery(deliveryId) {
  deliveryHistory.forget(deliveryId);
}
function completePublisherDelivery(deliveryId) {
  deliveryHistory.complete(deliveryId);
}
function getPendingPublisherTasks() {
  return tasks.length - head;
}
function clearPublisherQueue() {
  tasks.length = 0;
  head = 0;
  deliveryStates.clear();
  deliveryHistory.clear();
}
export default enqueuePublisherTask;
Object.assign(enqueuePublisherTask, {
  MAX_PENDING_PUBLISHER_TASKS,
  enqueuePublisherTask,
  dequeuePublisherTask,
  forgetPublisherDelivery,
  completePublisherDelivery,
  getPendingPublisherTasks,
  clearPublisherQueue,
});
