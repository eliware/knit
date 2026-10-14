export function formatCommandOutput({ cmd, stdout, stderr, exitCode }) {
  const statusSymbol = exitCode === 0 ? "✅ " : "❌ ";
  let output = statusSymbol + cmd + "\n";
  if (stdout) output += stdout.trim() + "\n";
  if (stderr) output += "ERRORS: \n" + stderr.trim() + "\n";
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}
