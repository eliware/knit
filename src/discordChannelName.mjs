export function channelName(repository) {
  if (!/^[^/]+\/[^/]+$/.test(repository || ""))
    throw new Error("Repository is required to resolve a Discord channel");
  const name = repository
    .split("/")
    .at(-1)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!name) throw new Error("Repository name has no supported channel characters");
  if (name.length > 100) throw new Error("Repository name exceeds the Discord channel name limit");
  return name;
}
