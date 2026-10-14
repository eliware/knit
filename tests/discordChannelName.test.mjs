import { channelName } from "../src/discordChannelName.mjs";

test("normalizes repository names and requires an owner and repository", () => {
  expect(channelName("eliware/eliware.org")).toBe("eliware-org");
  expect(channelName("eliware/!!!")).toBe("repository");
  expect(channelName("owner/a.b")).toBe(channelName("owner/a-b"));
  expect(channelName(`owner/${"a".repeat(120)}`)).toHaveLength(100);
  expect(() => channelName()).toThrow("Repository is required");
});
