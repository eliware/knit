export function selectWorkflowAction({ config, post = {} } = {}) {
  if (post.ref?.startsWith("refs/tags/")) {
    const tag = post.ref.slice("refs/tags/".length);
    const pattern = Object.keys(config.on.tags || {}).find(
      (candidate) =>
        candidate === tag || (candidate.endsWith("*") && tag.startsWith(candidate.slice(0, -1))),
    );
    return pattern ? config.on.tags[pattern] : null;
  }
  return config.on.push;
}
