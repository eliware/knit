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

test("returns formatted output and records an SSH execution failure", async () => {
  const sshExec = jest
    .fn()
    .mockRejectedValue(
      Object.assign(new Error("connection failed"), { stderr: "offline", code: 2 }),
    );
  const log = { error: jest.fn() };
  const result = await runDeployments({
    deployments: [deployment()],
    targets: { dev: target },
    body,
    event: "push",
    sshExec,
    stopOnError: true,
    log,
  });

  expect(result).toEqual({ output: expect.stringContaining("Exit Code: 2"), failed: true });
  expect(log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({ stage: "ssh_execution", error: "connection failed" }),
  );
});

test("rejects repositories outside the target allowlist before SSH execution", async () => {
  const sshExec = jest.fn();
  const log = { error: jest.fn() };
  await expect(
    runDeployments({
      deployments: [deployment()],
      targets: { dev: { ...target, allowedRepositories: ["eliware/approved"] } },
      body: { ...body, repository: { full_name: "eliware/other" } },
      event: "push",
      sshExec,
      stopOnError: true,
      log,
    }),
  ).rejects.toThrow("Repository is not approved for target: dev");
  expect(sshExec).not.toHaveBeenCalled();
  expect(log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({ stage: "target_validation", target: "dev" }),
  );
});
