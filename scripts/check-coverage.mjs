import fs from 'node:fs';

const summaryPath = 'coverage/coverage-summary.json';
if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found: ${summaryPath}`);
  process.exit(1);
}
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const failures = Object.entries(summary).filter(([file, metrics]) => file !== 'total' && Object.values(metrics).some(metric => metric.pct !== 100));
if (failures.length) {
  console.error('Coverage gaps found:');
  for (const [file, metrics] of failures) console.error(`${file}: ${Object.entries(metrics).map(([name, metric]) => `${name}=${metric.pct}%`).join(', ')}`);
  process.exit(1);
}
