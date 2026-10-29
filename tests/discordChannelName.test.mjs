import { channelName } from "../src/discordChannelName.mjs";

test("normalizes repository names and requires an owner and repository", () => {
  expect(channelName("eliware/agentx-cli")).toBe("agentx-cli");
  expect(channelName("eliware/eliware.org")).toBe("eliwareorg");
  expect(channelName(`owner/${"a".repeat(100)}`)).toHaveLength(100);
  expect(channelName("owner/a.b")).toBe("ab");
  expect(channelName("owner/a_b")).toBe("ab");
  expect(channelName("owner/a-b")).toBe("a-b");
  expect(() => channelName("owner/...")).toThrow("no supported channel characters");
  expect(() => channelName(`owner/${"a".repeat(101)}`)).toThrow(
    "exceeds the Discord channel name limit",
  );
  expect(() => channelName()).toThrow("Repository is required");
});
