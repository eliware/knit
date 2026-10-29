import { jest } from "@jest/globals";
import { logDeploymentCommand, logDeploymentFailure } from "../../src/repo/deploymentLog.mjs";

const context = {
  repository: "eliware/knit",
  ref: "refs/heads/main",
  deliveryId: "delivery-1",
};

test("logs a command result with correlation and duration fields", () => {
  const log = { error: jest.fn(), info: jest.fn() };
  logDeploymentCommand({
    log,
    context,
    deployment: { target: "production" },
    result: { command: "npm test", code: 0, duration: 125 },
  });

  expect(log.info).toHaveBeenCalledWith(
    "[Repo] Deployment command completed",
    expect.objectContaining({
      ...context,
      target: "production",
      command: "npm test",
      exitCode: 0,
      durationMs: 125,
      stage: "command",
    }),
  );
});

test("redacts sensitive command text and logs failed command status", () => {
  const log = { error: jest.fn(), info: jest.fn() };
  logDeploymentCommand({
    log,
    context,
    deployment: { target: "production" },
    result: { command: "deploy --password=sample-secret", code: 2 },
  });

  expect(log.error).toHaveBeenCalledWith(
    "[Repo] Deployment command failed",
    expect.objectContaining({
      ...context,
      exitCode: 2,
      durationMs: null,
      stage: "command",
    }),
  );
  expect(log.error.mock.calls[0][1].command).not.toContain("sample-secret");
});

test("logs a safe SSH failure summary without command output", () => {
  const log = { error: jest.fn() };
  const error = Object.assign(new Error("Authorization: Bearer sample-secret"), {
    code: "ECONNRESET",
    stdout: "remote secret output",
  });
  logDeploymentFailure({
    log,
    context,
    target: "production",
    stage: "ssh_execution",
    durationMs: 40,
    error,
  });

  expect(log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({
      ...context,
      target: "production",
      stage: "ssh_execution",
      durationMs: 40,
      errorCode: "ECONNRESET",
    }),
  );
  const details = log.error.mock.calls[0][1];
  expect(details.error).not.toContain("sample-secret");
  expect(JSON.stringify(details)).not.toContain("remote secret output");
});

test("logs target validation failures without an error object", () => {
  const log = { error: jest.fn() };
  logDeploymentFailure({
    log,
    context,
    target: "missing",
    stage: "target_validation",
    durationMs: 0,
  });

  expect(log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({ ...context, target: "missing", stage: "target_validation" }),
  );
});
