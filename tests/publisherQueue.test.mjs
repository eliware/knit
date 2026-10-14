import {
  clearPublisherQueue,
  dequeuePublisherTask,
  enqueuePublisherTask,
  getPendingPublisherTasks,
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

test("evicts the oldest delivery ID after the queue limit", () => {
  for (let index = 0; index <= 1000; index += 1)
    enqueuePublisherTask({ deliveryId: `id-${index}` });
  expect(enqueuePublisherTask({ deliveryId: "id-0" })).toBe(true);
  expect(getPendingPublisherTasks()).toBe(1002);
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
