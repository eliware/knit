import { enqueuePublisherTask } from "../src/publisherQueue.mjs";
import {
  getPublisherMetrics,
  recordPublisherMetric,
  setPublisherProcessing,
  _resetPublisherState,
} from "../src/publisherState.mjs";

afterEach(() => _resetPublisherState());

test("reports publisher metrics and resets state with its queue", () => {
  enqueuePublisherTask({ deliveryId: "delivery" });
  recordPublisherMetric("queued");
  setPublisherProcessing(true);
  expect(getPublisherMetrics()).toEqual({
    queued: 1,
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
    duplicates: 0,
    pending: 1,
    processing: true,
  });

  _resetPublisherState();
  expect(getPublisherMetrics()).toEqual({
    queued: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
    duplicates: 0,
    pending: 0,
    processing: false,
  });
});
