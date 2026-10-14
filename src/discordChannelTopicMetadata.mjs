export function channelTopic(packageJson = {}) {
  const description =
    typeof packageJson.description === "string" ? packageJson.description.trim() : "";
  const keywords = Array.isArray(packageJson.keywords)
    ? packageJson.keywords.filter((keyword) => typeof keyword === "string")
    : [];
  const keywordText = keywords.length ? `Keywords: ${keywords.join(", ")}` : "";
  if (!keywordText) return description.slice(0, 1024);
  if (keywordText.length > 1024)
    throw new Error("Package keywords exceed the Discord channel topic limit");
  const descriptionLimit = Math.max(0, 1023 - keywordText.length);
  const boundedDescription = description.slice(0, descriptionLimit);
  return boundedDescription ? `${boundedDescription}\n${keywordText}` : keywordText;
}
