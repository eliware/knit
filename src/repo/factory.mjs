import { log as logger } from "@eliware/common";
import { sshExec as realSshExec } from "@eliware/ssh-client";
import __knitModule0 from "../repo.mjs";
const { updateSshRepo } = __knitModule0;

function createSshRepo({
  config = { deployments: [] },
  targets = {},
  packageJson,
  sshExec: injectedSshExec,
  log = logger,
  sendNotification,
} = {}) {
  const sshExec = injectedSshExec || realSshExec;
  const stopOnError = config.stopOnError ?? true;
  return {
    targets: config.deployments,
    async update({ body, event = "push", deliveryId = null, log: requestLog = log }) {
      return updateSshRepo({
        repo: this,
        config,
        targets,
        packageJson,
        sshExec,
        stopOnError,
        notifyFn: sendNotification,
        log,
        body,
        event,
        deliveryId,
        requestLog,
      });
    },
  };
}

export default createSshRepo;
Object.assign(createSshRepo, { createSshRepo });
