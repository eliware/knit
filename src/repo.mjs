import __knitModule0 from "./repo/deployments.mjs";
import __knitModule1 from "./repoNotifications.mjs";
const { runDeployments } = __knitModule0;
const { isTagUpdate, notifyUpdate } = __knitModule1;
async function updateSshRepo({
  repo,
  config,
  targets,
  packageJson,
  sshExec,
  stopOnError,
  notifyFn,
  log,
  body,
  event = "push",
  deliveryId = null,
  requestLog = log,
}) {
  if (!body || !Array.isArray(body.commits)) {
    requestLog.error("[Repo] body validation failed");
    return false;
  }
  if (isTagUpdate(body)) {
    await notifyUpdate({ notifyFn, repo, body, event, packageJson, log: requestLog });
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
    repo,
    body,
    packageJson,
    event,
    output,
    failed,
    log: requestLog,
  });
  return !failed;
}
export default updateSshRepo;
Object.assign(updateSshRepo, {
  updateSshRepo,
});
