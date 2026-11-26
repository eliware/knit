import { log as logger } from "@eliware/common";
import { sshExec as realSshExec } from "@eliware/ssh-client";
import __knitModule0 from "./repo/deployments.mjs";
import __knitModule1 from "./repoNotifications.mjs";
const { runDeployments } = __knitModule0;
const { isTagUpdate, notifyUpdate } = __knitModule1;
function createSshRepo({
  config = {
    deployments: [],
  },
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
      if (isTagUpdate(body)) {
        await notifyUpdate({
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
      await notifyUpdate({
        notifyFn,
        repo: this,
        body,
        packageJson,
        event,
        output,
        failed,
        log: requestLog,
      });
      return !failed;
    },
  };
}
export default createSshRepo;
Object.assign(createSshRepo, {
  createSshRepo,
});
