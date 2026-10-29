import {
  completePublisherDelivery,
  clearPublisherQueue,
  dequeuePublisherTask,
  enqueuePublisherTask,
  forgetPublisherDelivery,
  getPendingPublisherTasks,
  MAX_PENDING_PUBLISHER_TASKS,
} from "../src/publisherQueue.mjs";

afterEach(() => clearPublisherQueue());

test("queues distinct tasks and rejects duplicate delivery IDs", () => {
  const task = { deliveryId: "same" };
  expect(enqueuePublisherTask(task)).toBe(true);
  expect(enqueuePublisherTask(task)).toBe(false);
  expect(getPendingPublisherTasks()).toBe(1);
  expect(dequeuePublisherTask()).toBe(task);
  expect(getPendingPublisherTasks()).toBe(0);
  expect(dequeuePublisherTask()).toBeUndefined();
});

test("keeps delivery IDs while their tasks remain queued", () => {
  for (let index = 0; index < MAX_PENDING_PUBLISHER_TASKS; index += 1)
    enqueuePublisherTask({ deliveryId: `id-${index}` });
  expect(enqueuePublisherTask({ deliveryId: "id-0" })).toBe(false);
  expect(enqueuePublisherTask({ deliveryId: "overflow" })).toBe(null);
  expect(getPendingPublisherTasks()).toBe(MAX_PENDING_PUBLISHER_TASKS);
});

test("keeps pending delivery IDs outside the completed history limit", () => {
  for (let index = 0; index < MAX_PENDING_PUBLISHER_TASKS; index += 1)
    enqueuePublisherTask({ deliveryId: `pending-${index}` });
  dequeuePublisherTask();
  completePublisherDelivery("pending-0");
  expect(enqueuePublisherTask({ deliveryId: "pending-0" })).toBe(false);
});

test("evicts only completed delivery IDs after the history limit", () => {
  for (let index = 0; index <= 10_000; index += 1) {
    enqueuePublisherTask({ deliveryId: `id-${index}` });
    dequeuePublisherTask();
    completePublisherDelivery(`id-${index}`);
  }
  expect(enqueuePublisherTask({ deliveryId: "id-0" })).toBe(true);
});

test("allows a failed delivery ID to enter the queue again", () => {
  const task = { deliveryId: "retry" };
  forgetPublisherDelivery(null);
  expect(enqueuePublisherTask(task)).toBe(true);
  expect(dequeuePublisherTask()).toBe(task);
  forgetPublisherDelivery(task.deliveryId);
  expect(enqueuePublisherTask(task)).toBe(true);
});

test("keeps FIFO order after the queue compacts its consumed prefix", () => {
  for (let index = 0; index < 100; index += 1) enqueuePublisherTask({ value: index });
  for (let index = 0; index < 75; index += 1)
    expect(dequeuePublisherTask()).toEqual({ value: index });
  for (let index = 100; index < 140; index += 1) enqueuePublisherTask({ value: index });
  for (let index = 75; index < 140; index += 1)
    expect(dequeuePublisherTask()).toEqual({ value: index });
  expect(getPendingPublisherTasks()).toBe(0);
});
