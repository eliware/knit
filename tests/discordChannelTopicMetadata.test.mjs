import __knitModule0 from "../src/discordChannelTopicMetadata.mjs";
const { channelTopic } = __knitModule0;
test("builds bounded channel topics from package metadata", () => {
  expect(
    channelTopic({
      description: " App ",
      keywords: ["web", 1, "deploy"],
    }),
  ).toBe("App\nKeywords: web, deploy");
  expect(channelTopic()).toBe("");
  expect(
    channelTopic({
      description: "x".repeat(1100),
    }),
  ).toHaveLength(1024);
  expect(
    channelTopic({
      keywords: ["web"],
    }),
  ).toBe("Keywords: web");
  const topic = channelTopic({
    description: "x".repeat(1100),
    keywords: ["web", "deploy"],
  });
  expect(topic).toHaveLength(1024);
  expect(topic.endsWith("\nKeywords: web, deploy")).toBe(true);
  const maximumKeywordText = `Keywords: ${"x".repeat(1014)}`;
  const maximumKeywordTopic = channelTopic({
    description: "Description",
    keywords: ["x".repeat(1014)],
  });
  expect(maximumKeywordTopic).toBe(maximumKeywordText);
  expect(maximumKeywordTopic).toHaveLength(1024);
  expect(() =>
    channelTopic({
      keywords: ["x".repeat(1024)],
    }),
  ).toThrow("Package keywords are above the Discord channel topic limit");
});
