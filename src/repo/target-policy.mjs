import __knitModule0 from "./deploymentLog.mjs";
const { logDeploymentFailure } = __knitModule0;

function validateDeploymentTarget({ deployment, targets, context, log }) {
  const target = targets[deployment.target];
  if (!target) {
    logDeploymentFailure({
      log,
      context,
      target: deployment.target,
      stage: "target_validation",
      durationMs: 0,
    });
    throw new Error(`Unknown deployment target: ${deployment.target}`);
  }
  if (target.allowedRepositories && !target.allowedRepositories.includes(context.repository)) {
    logDeploymentFailure({
      log,
      context,
      target: deployment.target,
      stage: "target_validation",
      durationMs: 0,
    });
    throw new Error(`Repository is not approved for target: ${deployment.target}`);
  }
  const root = target.allowedCwdRoot?.replace(/\/+$/u, "") || "";
  if (root && !(deployment.cwd === root || deployment.cwd.startsWith(`${root}/`))) {
    logDeploymentFailure({
      log,
      context,
      target: deployment.target,
      stage: "target_validation",
      durationMs: 0,
    });
    throw new Error(`Deployment cwd is outside target root: ${deployment.target}`);
  }
  return target;
}

export default validateDeploymentTarget;
Object.assign(validateDeploymentTarget, {
  validateDeploymentTarget,
});
