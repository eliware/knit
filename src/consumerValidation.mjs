export function validateConsumerMessage({ GitHubMod, post, event, log }) {
  if (GitHubMod.validate({ post, event, log })) return true;
  log.error("[Consumer] GitHub validation failed");
  return false;
}
