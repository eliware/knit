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
