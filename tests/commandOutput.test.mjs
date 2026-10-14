import { formatCommandOutput } from "../src/commandOutput.mjs";

test("formats successful command output", () => {
  expect(formatCommandOutput({ cmd: "deploy", stdout: " ready \n", stderr: "", exitCode: 0 })).toBe(
    "✅ deploy\nready\n",
  );
});

test("formats failed command output with errors", () => {
  expect(formatCommandOutput({ cmd: "deploy", stdout: "", stderr: "failed\n", exitCode: 2 })).toBe(
    "❌ deploy\nERRORS: \nfailed\nExit Code: 2\n\n",
  );
});

test("formats failed command output without streams", () => {
  expect(formatCommandOutput({ cmd: "deploy", exitCode: 1 })).toBe("❌ deploy\nExit Code: 1\n\n");
});
