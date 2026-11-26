import __knitModule0 from "./publisherQueue.mjs";
const { clearPublisherQueue, getPendingPublisherTasks } = __knitModule0;
let processing = false;
const metrics = {
  queued: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  retried: 0,
  duplicates: 0,
};
function recordPublisherMetric(name) {
  metrics[name] += 1;
}
function isPublisherProcessing() {
  return processing;
}
function setPublisherProcessing(value) {
  processing = value;
}
function getPublisherMetrics() {
  return {
    ...metrics,
    pending: getPendingPublisherTasks(),
    processing,
  };
}
function _resetPublisherState() {
  clearPublisherQueue();
  processing = false;
  Object.keys(metrics).forEach((key) => {
    metrics[key] = 0;
  });
}
export default recordPublisherMetric;
Object.assign(recordPublisherMetric, {
  recordPublisherMetric,
  isPublisherProcessing,
  setPublisherProcessing,
  getPublisherMetrics,
  _resetPublisherState,
});
