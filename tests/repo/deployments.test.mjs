import { jest } from "@jest/globals";
import { runDeployments } from "../../src/repo/deployments.mjs";
import { body, deployment, target } from "../../test-fixtures/repo.mjs";

test("runs trusted SSH deployment commands and returns formatted output", async () => {
  const sshExec = jest.fn().mockResolvedValue([{ command: "deploy", result: "ok", code: 0 }]);
  const commitSha = "a".repeat(40);
  const result = await runDeployments({
    deployments: [deployment()],
    targets: { dev: target },
    body: {
      ...body,
      after: commitSha,
      ref: "refs/heads/main",
      repository: { full_name: "eliware/app" },
    },
    event: "push",
    deliveryId: "delivery-1",
    sshExec,
    stopOnError: true,
    log: { error: jest.fn() },
  });
  expect(result).toEqual({ output: expect.stringContaining("deploy"), failed: false });
  expect(sshExec).toHaveBeenCalledWith(
    expect.objectContaining({
      commands: ["one", "two"],
      env: {
        KNIT_COMMIT_SHA: commitSha,
        KNIT_REPOSITORY: "eliware/app",
        KNIT_REF: "refs/heads/main",
        KNIT_EVENT: "push",
        KNIT_DELIVERY_ID: "delivery-1",
      },
    }),
  );
});
