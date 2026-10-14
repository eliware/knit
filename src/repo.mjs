import { log as logger } from "@eliware/common";
import { sshExec as realSshExec } from "@eliware/ssh-client";
import * as Notifier from "./notifier/index.mjs";
import { runDeployments } from "./repo/deployments.mjs";
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
      const { output, failed } = await runDeployments({
        deployments: config.deployments,
        targets,
        body,
        event,
        deliveryId,
        sshExec,
        stopOnError,
        log: requestLog,
      });
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
