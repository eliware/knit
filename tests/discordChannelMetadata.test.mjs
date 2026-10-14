import { channelName, channelTopic } from "../src/discordChannelMetadata.mjs";

test("normalizes repository names and requires an owner and repository", () => {
  expect(channelName("eliware/eliware.org")).toMatch(/^eliware-org-[a-f0-9]{12}$/u);
  expect(channelName("eliware/!!!")).toMatch(/^repository-[a-f0-9]{12}$/u);
  expect(channelName("owner/a.b")).not.toBe(channelName("owner/a-b"));
  expect(channelName(`owner/${"a".repeat(120)}`)).toHaveLength(100);
  expect(() => channelName()).toThrow("Repository is required");
});

test("builds bounded channel topics from package metadata", () => {
  expect(channelTopic({ description: " App ", keywords: ["web", 1, "deploy"] })).toBe(
    "App\nKeywords: web, deploy",
  );
  expect(channelTopic()).toBe("");
  expect(channelTopic({ description: "x".repeat(1100) })).toHaveLength(1024);
});
