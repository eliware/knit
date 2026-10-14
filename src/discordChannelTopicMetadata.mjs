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
