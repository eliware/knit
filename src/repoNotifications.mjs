import Notifier from "./notifier/send.mjs";
function isTagUpdate(body) {
  return body?.ref?.startsWith("refs/tags/") || false;
}
async function notifyUpdate(options) {
  return isTagUpdate(options.body) ? notifyTag(options) : notifyPush(options);
}
async function notifyTag({
  notifyFn,
  repo,
  body,
  event,
  packageJson,
  log,
  NotifierMod = Notifier,
}) {
  if (notifyFn) {
    return notifyFn({
      repo,
      body,
      event,
      logOutput: "",
      hasError: false,
      log,
    });
  }
  return NotifierMod.send({
    post: body,
    packageJson,
    event,
    logOutput: "",
    hasError: false,
    log,
  });
}
async function notifyPush({
  notifyFn,
  repo,
  body,
  packageJson,
  event,
  output,
  failed,
  log,
  NotifierMod = Notifier,
}) {
  const notification = {
    repo,
    body,
    logOutput: output,
    hasError: failed,
    log,
  };
  if (notifyFn) return notifyFn(notification);
  return NotifierMod.send({
    post: body,
    packageJson,
    event,
    logOutput: output,
    hasError: failed,
    log,
  });
}
export default isTagUpdate;
Object.assign(isTagUpdate, {
  isTagUpdate,
  notifyUpdate,
  notifyTag,
  notifyPush,
});
