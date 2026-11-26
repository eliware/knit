function normalizeChannelName(repository) {
  if (!/^[^/]+\/[^/]+$/u.test(repository || ""))
    throw new Error("Repository is required to resolve a Discord channel");
  const name = repository
    .split("/")
    .at(-1)
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, "");
  if (!name) throw new Error("Repository name has no supported channel characters");
  return name;
}

export default normalizeChannelName;
Object.assign(normalizeChannelName, {
  normalizeChannelName,
});
