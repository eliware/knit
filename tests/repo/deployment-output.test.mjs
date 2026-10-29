import { createDeploymentOutput } from "../../src/repo/deployment-output.mjs";

test("formats and redacts output from successful and failed commands", () => {
  const output = createDeploymentOutput();
  output.appendResult({
    command: "deploy --password=sample-secret",
    result: "ready",
    stderr: "",
    code: 0,
  });
  output.appendError("deploy --token=sample-secret", {
    stdout: "",
    stderr: "Authorization: Bearer sample-token",
    code: 2,
  });
  output.appendError("deploy", { stdout: "", stderr: "offline" });

  expect(output.toString()).toContain("ready");
  expect(output.toString()).toContain("Exit Code: 2");
  expect(output.toString()).toContain("Exit Code: 1");
  expect(output.toString()).not.toContain("sample-secret");
  expect(output.toString()).not.toContain("sample-token");
});
