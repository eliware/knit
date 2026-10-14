import { channelTopic } from "../src/discordChannelTopicMetadata.mjs";

test("builds bounded channel topics from package metadata", () => {
  expect(channelTopic({ description: " App ", keywords: ["web", 1, "deploy"] })).toBe(
    "App\nKeywords: web, deploy",
  );
  expect(channelTopic()).toBe("");
  expect(channelTopic({ description: "x".repeat(1100) })).toHaveLength(1024);
  expect(channelTopic({ keywords: ["web"] })).toBe("Keywords: web");
  const topic = channelTopic({ description: "x".repeat(1100), keywords: ["web", "deploy"] });
  expect(topic).toHaveLength(1024);
  expect(topic.endsWith("\nKeywords: web, deploy")).toBe(true);
});
