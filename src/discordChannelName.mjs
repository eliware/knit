export function channelName(repository) {
  if (!/^[^/]+\/[^/]+$/.test(repository || ""))
    throw new Error("Repository is required to resolve a Discord channel");
  // Use the repository basename. The eliware organization keeps these names unique.
  return (
    repository
      .split("/")
      .at(-1)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "repository"
  );
}
