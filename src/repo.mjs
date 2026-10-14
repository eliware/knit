import { log as logger } from "@eliware/common";
import { sshExec as realSshExec } from "@eliware/ssh-client";
import * as Notifier from "./notifier/index.mjs";
import { createWebhookEnvironment, withWebhookEnvironment } from "./webhookEnvironment.mjs";
import { formatCommandOutput } from "./commandOutput.mjs";
import { notifyTag } from "./repoNotifications.mjs";
export function createSshRepo({
  config = { deployments: [] },
  targets = {},
  packageJson,
  sshExec: injectedSshExec,
  log = logger,
  sendNotification,
} = {}) {
  const sshExec = injectedSshExec || realSshExec;
  const stopOnError = config.stopOnError ?? true,
    notifyFn = sendNotification;
  return {
    targets: config.deployments,
    async update({ body, event = "push", deliveryId = null, log: requestLog = log }) {
      if (!body || !Array.isArray(body.commits)) {
        requestLog.error("[Repo] body validation failed");
        return false;
      }
      if (body.ref?.startsWith("refs/tags/")) {
        await notifyTag({
          notifyFn,
          repo: this,
          body,
          event,
          packageJson,
          log: requestLog,
        });
        return true;
      }
      let output = "";
      let failed = false;
      for (const deployment of config.deployments) {
        const target = targets[deployment.target];
        if (!target) throw new Error(`Unknown deployment target: ${deployment.target}`);
        const root = target.allowedCwdRoot?.replace(/\/+$/, "") || "";
        if (
          root &&
          !(deployment.cwd === root || root === "" || deployment.cwd.startsWith(`${root}/`))
        )
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
              requestLog.error(`[Repo] SSH command failed: ${result.command}`, result);
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
          requestLog.error("[Repo] SSH connection failed", error);
          failed = true;
        }
        if (failed && stopOnError) break;
      }
      await notifyFn?.({ repo: this, body, logOutput: output, hasError: failed, log: requestLog });
      if (!notifyFn)
        await Notifier.send({
          post: body,
          packageJson,
          event,
          logOutput: output,
          hasError: failed,
          log: requestLog,
        });
      return !failed;
    },
  };
}
