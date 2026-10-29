import { jest } from "@jest/globals";
import { runDeployments } from "../../src/repo/deployments.mjs";
import { body, deployment, target } from "../../test-fixtures/repo.mjs";

test("redacts credential text from command output before returning it", async () => {
  const sshExec = jest.fn().mockResolvedValue([
    {
      command: "deploy --password=sample-secret",
      result: "Authorization: Bearer sample-token",
      stderr: "",
      code: 0,
      duration: 15,
    },
  ]);
  const result = await runDeployments({
    deployments: [deployment()],
    targets: { dev: target },
    body,
    event: "push",
    deliveryId: "delivery-1",
    sshExec,
    stopOnError: true,
    log: { error: jest.fn(), info: jest.fn() },
  });

  expect(result.output).not.toContain("sample-secret");
  expect(result.output).not.toContain("sample-token");
});
