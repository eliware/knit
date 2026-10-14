import { jest } from "@jest/globals";
import { runDeployments } from "../../src/repo/deployments.mjs";
import { body, deployment, target } from "../../test-fixtures/repo.mjs";

test("runs trusted SSH deployment commands and returns formatted output", async () => {
  const sshExec = jest.fn().mockResolvedValue([{ command: "deploy", result: "ok", code: 0 }]);
  const result = await runDeployments({
    deployments: [deployment()],
    targets: { dev: target },
    body,
    event: "push",
    deliveryId: null,
    sshExec,
    stopOnError: true,
    log: { error: jest.fn() },
  });
  expect(result).toEqual({ output: expect.stringContaining("deploy"), failed: false });
});
