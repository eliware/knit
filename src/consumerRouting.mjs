export function resolveConsumerTarget({ RouterMod, RepoMod, post, event = "push", log }) {
  const routerOptions = { post, event, RepoMod, log };
  if (RepoMod.targetLoader) routerOptions.targetLoader = RepoMod.targetLoader;
  return RouterMod.resolveEventTarget(routerOptions);
}
