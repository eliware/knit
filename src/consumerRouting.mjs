export function resolveConsumerTarget({ RouterMod, RepoMod, post, log }) {
  const routerOptions = { post, RepoMod, log };
  if (RepoMod.targetLoader) routerOptions.targetLoader = RepoMod.targetLoader;
  return RouterMod.resolveEventTarget(routerOptions);
}
