import __knitModule0 from "../../../src/discord/channel/name.mjs";
const { normalizeChannelName } = __knitModule0;

test("normalizes a repository name after the owner slash", () => {
  expect(normalizeChannelName("eliware/agentx-cli")).toBe("agentx-cli");
  expect(normalizeChannelName("eliware/eliware.org")).toBe("eliwareorg");
  expect(normalizeChannelName("owner/a.b")).toBe("ab");
  expect(normalizeChannelName("owner/a_b")).toBe("ab");
  expect(normalizeChannelName("owner/a-b")).toBe("a-b");
});

test("requires an owner and repository", () => {
  expect(() => normalizeChannelName()).toThrow("Repository is required");
  expect(() => normalizeChannelName("owner")).toThrow("Repository is required");
});

test("rejects names without supported channel characters", () => {
  expect(() => normalizeChannelName("owner/...")).toThrow("no supported channel characters");
});
