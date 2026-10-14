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
});

test("evicts the oldest delivery ID after the queue limit", () => {
  for (let index = 0; index <= 1000; index += 1)
    enqueuePublisherTask({ deliveryId: `id-${index}` });
  expect(enqueuePublisherTask({ deliveryId: "id-0" })).toBe(true);
  expect(getPendingPublisherTasks()).toBe(1002);
});
