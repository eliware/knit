export function selectWorkflowAction({ config, post = {} } = {}) {
  if (post.ref?.startsWith("refs/tags/")) {
    const tag = post.ref.slice("refs/tags/".length);
    const versionTag = /^v\d+\.\d+\.\d+$/.test(tag);
    const pattern = Object.keys(config.on.tags || {}).find(
      (candidate) => (candidate === "v" || candidate === "v*") && versionTag,
    );
    return pattern ? config.on.tags[pattern] : null;
  }
  return config.on.push;
}
