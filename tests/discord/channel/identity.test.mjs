import __knitModule0 from "../../../src/discord/channel/identity.mjs";
const { createChannelIdentity } = __knitModule0;

test("normalizes a repository name after the owner slash", () => {
  expect(createChannelIdentity("eliware/agentx-cli")).toBe("agentx-cli");
  expect(createChannelIdentity("eliware/eliware.org")).toBe("eliwareorg");
  expect(createChannelIdentity("owner/a.b")).toBe("ab");
  expect(createChannelIdentity("owner/a_b")).toBe("ab");
  expect(createChannelIdentity("owner/a-b")).toBe("a-b");
});

test("requires an owner and repository", () => {
  expect(() => createChannelIdentity()).toThrow("Repository is required");
  expect(() => createChannelIdentity("owner")).toThrow("Repository is required");
});

test("rejects names without supported channel characters", () => {
  expect(() => createChannelIdentity("owner/...")).toThrow("no supported channel characters");
});

test("accepts a channel name at the Discord length limit", () => {
  expect(createChannelIdentity(`owner/${"a".repeat(100)}`)).toHaveLength(100);
});

test("rejects a channel name longer than the Discord limit", () => {
  expect(() => createChannelIdentity(`owner/${"a".repeat(101)}`)).toThrow(
    "exceeds the Discord channel name limit",
  );
});
