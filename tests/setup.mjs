// Keep expected logger output from polluting test results while preserving callability.
// Individual tests can still spy on these methods and assert console behavior.
for (const method of ['debug', 'info', 'log', 'warn', 'error']) {
  if (typeof console[method] === 'function') console[method] = () => {};
}
