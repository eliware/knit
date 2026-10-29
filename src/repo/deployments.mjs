import { createWebhookEnvironment } from "../webhookEnvironment.mjs";
import { logDeploymentCommand, logDeploymentFailure } from "./deploymentLog.mjs";
import { createDeploymentOutput } from "./deployment-output.mjs";

export async function runDeployments({
  deployments,
  targets,
  body,
  event,
  deliveryId,
  sshExec,
  stopOnError,
  log,
}) {
  const output = createDeploymentOutput();
  let failed = false;
  const context = {
    repository: body?.repository?.full_name || null,
    ref: body?.ref || null,
    deliveryId: deliveryId ?? null,
  };
  for (const deployment of deployments) {
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
    const root = target.allowedCwdRoot?.replace(/\/+$/, "") || "";
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
    const startedAt = Date.now();
    try {
      const environment = createWebhookEnvironment({ body, event, deliveryId });
      const results = await sshExec({
        host: target.host,
        username: target.user,
        commands: deployment.commands,
        cwd: deployment.cwd,
        privateKeyPath: target.identity,
        knownHostsPath: target.knownHosts,
        hostCaPath: target.hostCa,
        env: environment,
        commandTimeout: deployment.timeoutMs,
      });
      for (const result of results) {
        logDeploymentCommand({ log, context, deployment, result });
        output.appendResult(result);
        if (result.code !== 0) {
          failed = true;
          break;
        }
      }
    } catch (error) {
      output.appendError(deployment.commands.at(-1), error);
      logDeploymentFailure({
        log,
        context,
        target: deployment.target,
        stage: "ssh_execution",
        durationMs: Date.now() - startedAt,
        error,
      });
      failed = true;
    }
    if (failed && stopOnError) break;
  }
  return { output: output.toString(), failed };
}
