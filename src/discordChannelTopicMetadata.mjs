export function channelTopic(packageJson = {}) {
  const description =
    typeof packageJson.description === "string" ? packageJson.description.trim() : "";
  const keywords = Array.isArray(packageJson.keywords)
    ? packageJson.keywords.filter((keyword) => typeof keyword === "string")
    : [];
  const keywordText = keywords.length ? `Keywords: ${keywords.join(", ")}` : "";
  if (!keywordText) return description.slice(0, 1024);
  const boundedKeywords = keywordText.slice(0, 1024);
  const descriptionLimit = Math.max(0, 1023 - boundedKeywords.length);
  const boundedDescription = description.slice(0, descriptionLimit);
  return boundedDescription ? `${boundedDescription}\n${boundedKeywords}` : boundedKeywords;
}
