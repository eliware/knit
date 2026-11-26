import __knitModule0 from "../consumerPush.mjs";
const { processRepositoryPush } = __knitModule0;

async function routePushEvent({
  message,
  log,
  RepoMod,
  RouterMod,
  presence,
  processPush = processRepositoryPush,
}) {
  const post = message.parsed;
  return processPush({
    post,
    deliveryId: message.deliveryId ?? null,
    log,
    RepoMod,
    RouterMod,
    presence,
    repository: post?.repository?.full_name || "webhook",
  });
}

export default routePushEvent;
Object.assign(routePushEvent, { routePushEvent });
