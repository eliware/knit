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
