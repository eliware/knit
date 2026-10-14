export const GUILD_ANNOUNCEMENT = 5;

export function channelName(repository) {
  if (!/^[^/]+\/[^/]+$/.test(repository || ""))
    throw new Error("Repository is required to resolve a Discord channel");
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

export function channelTopic(packageJson = {}) {
  const description =
    typeof packageJson.description === "string" ? packageJson.description.trim() : "";
  const keywords = Array.isArray(packageJson.keywords)
    ? packageJson.keywords.filter((keyword) => typeof keyword === "string")
    : [];
  return [description, keywords.length ? `Keywords: ${keywords.join(", ")}` : ""]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1024);
}
