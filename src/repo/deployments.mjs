import { formatCommandOutput } from "../commandOutput.mjs";
import { createWebhookEnvironment, withWebhookEnvironment } from "../webhookEnvironment.mjs";

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
  let output = "";
  let failed = false;
  for (const deployment of deployments) {
    const target = targets[deployment.target];
    if (!target) throw new Error(`Unknown deployment target: ${deployment.target}`);
    const root = target.allowedCwdRoot?.replace(/\/+$/, "") || "";
    if (root && !(deployment.cwd === root || deployment.cwd.startsWith(`${root}/`)))
      throw new Error(`Deployment cwd is outside target root: ${deployment.target}`);
    try {
      const environment = createWebhookEnvironment({ body, event, deliveryId });
      const results = await sshExec({
        host: target.host,
        username: target.user,
        commands: deployment.commands.map((command) =>
          withWebhookEnvironment(command, environment),
        ),
        cwd: deployment.cwd,
        privateKeyPath: target.identity,
        knownHostsPath: target.knownHosts,
        hostCaPath: target.hostCa,
        env: environment,
        commandTimeout: deployment.timeoutMs,
      });
      for (const result of results) {
        output += formatCommandOutput({
          cmd: result.command,
          stdout: result.result,
          stderr: "",
          exitCode: result.code,
        });
        if (result.code !== 0) {
          log.error(`[Repo] SSH command failed: ${result.command}`, result);
          failed = true;
          break;
        }
      }
    } catch (error) {
      output += formatCommandOutput({
        cmd: deployment.commands.at(-1),
        stdout: error.stdout,
        stderr: error.stderr,
        exitCode: error.code || 1,
      });
      log.error("[Repo] SSH connection failed", error);
      failed = true;
    }
    if (failed && stopOnError) break;
  }
  return { output, failed };
}
