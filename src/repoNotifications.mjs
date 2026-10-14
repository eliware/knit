import * as Notifier from "./notifier/index.mjs";

export async function notifyTag({
  notifyFn,
  repo,
  body,
  event,
  packageJson,
  log,
  NotifierMod = Notifier,
}) {
  if (notifyFn) {
    return notifyFn({ repo, body, event, logOutput: "", hasError: false, log });
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

export async function notifyPush({
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
