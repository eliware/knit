// Keep expected logger output from polluting test results. Winston reads this
// before modules create their default logger; individual tests can still inject
// and assert their own logger instances.
process.env.LOG_LEVEL = 'silent';
for (const method of ['debug', 'info', 'log', 'warn', 'error']) {
  if (typeof console[method] === 'function') console[method] = () => {};
}
