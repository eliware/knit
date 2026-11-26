import { jest } from "@jest/globals";
import { deployment, target } from "../../test-fixtures/repo.mjs";
import __knitModule0 from "../../src/repo/target-policy.mjs";
const { validateDeploymentTarget } = __knitModule0;

const options = ({ deploymentOverrides, targetOverrides, repository = "eliware/knit" } = {}) => ({
  deployment: deployment(deploymentOverrides),
  targets: {
    dev: {
      ...target,
      ...targetOverrides,
    },
  },
  context: {
    repository,
    ref: "refs/heads/main",
    deliveryId: "delivery-1",
  },
  log: {
    error: jest.fn(),
  },
});

test("returns a target without optional policy rules", () => {
  const input = options();
  expect(validateDeploymentTarget(input)).toEqual(target);
});

test("accepts an approved repository and a working directory under its root", () => {
  const input = options({
    deploymentOverrides: { cwd: "/opt/app/service" },
    targetOverrides: {
      allowedRepositories: ["eliware/knit"],
      allowedCwdRoot: "/opt/app/",
    },
  });
  expect(validateDeploymentTarget(input).allowedRepositories).toEqual(["eliware/knit"]);
});

test("accepts a working directory equal to its allowed root", () => {
  const input = options({
    deploymentOverrides: { cwd: "/opt/app" },
    targetOverrides: { allowedCwdRoot: "/opt/app" },
  });
  expect(validateDeploymentTarget(input).allowedCwdRoot).toBe("/opt/app");
});

test("rejects an unknown target and logs the policy failure", () => {
  const input = options({ deploymentOverrides: { target: "missing" } });
  expect(() => validateDeploymentTarget(input)).toThrow("Unknown deployment target: missing");
  expect(input.log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({ target: "missing", stage: "target_validation" }),
  );
});

test("rejects a repository outside its target allowlist", () => {
  const input = options({
    targetOverrides: { allowedRepositories: ["eliware/approved"] },
  });
  expect(() => validateDeploymentTarget(input)).toThrow(
    "Repository is not approved for target: dev",
  );
  expect(input.log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({ target: "dev", stage: "target_validation" }),
  );
});

test("rejects a working directory outside its allowed root", () => {
  const input = options({
    deploymentOverrides: { cwd: "/opt/application" },
    targetOverrides: { allowedCwdRoot: "/opt/app" },
  });
  expect(() => validateDeploymentTarget(input)).toThrow(
    "Deployment cwd is outside target root: dev",
  );
  expect(input.log.error).toHaveBeenCalledWith(
    "[Repo] Deployment failed",
    expect.objectContaining({ target: "dev", stage: "target_validation" }),
  );
});
