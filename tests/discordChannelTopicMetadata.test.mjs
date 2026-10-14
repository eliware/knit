import { channelTopic } from "../src/discordChannelTopicMetadata.mjs";

test("builds bounded channel topics from package metadata", () => {
  expect(channelTopic({ description: " App ", keywords: ["web", 1, "deploy"] })).toBe(
    "App\nKeywords: web, deploy",
  );
  expect(channelTopic()).toBe("");
  expect(channelTopic({ description: "x".repeat(1100) })).toHaveLength(1024);
});
