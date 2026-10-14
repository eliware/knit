import * as Notifier from "./notifier/send.mjs";

export function isTagUpdate(body) {
  return body?.ref?.startsWith("refs/tags/") || false;
}

export async function notifyUpdate(options) {
  return isTagUpdate(options.body) ? notifyTag(options) : notifyPush(options);
}

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
