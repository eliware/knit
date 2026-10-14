import { channelName } from "../src/discordChannelName.mjs";

test("normalizes repository names and requires an owner and repository", () => {
  expect(channelName("eliware/agentx-cli")).toBe("agentx-cli");
  expect(channelName("eliware/eliware.org")).toBe("eliware_x2e_org");
  expect(channelName("owner/a.b")).not.toBe(channelName("owner/a-b"));
  expect(channelName("owner/a_b")).not.toBe(channelName("owner/a-b"));
  expect(() => channelName(`owner/${"a".repeat(120)}`)).toThrow(
    "exceeds the Discord channel name limit",
  );
  expect(() => channelName()).toThrow("Repository is required");
});
