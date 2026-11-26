import __knitModule0 from "../../../src/discord/channel/name-policy.mjs";
const { createChannelName } = __knitModule0;

test("normalizes repository names for Discord channels", () => {
  expect(createChannelName("agentx-cli")).toBe("agentx-cli");
  expect(createChannelName("eliware.org")).toBe("eliwareorg");
  expect(createChannelName("a.b")).toBe("ab");
  expect(createChannelName("a_b")).toBe("ab");
  expect(createChannelName("A-B")).toBe("a-b");
});

test("rejects names without supported channel characters", () => {
  expect(() => createChannelName("...")).toThrow("no supported channel characters");
});

test("enforces Discord channel name length", () => {
  expect(createChannelName("a".repeat(100))).toHaveLength(100);
  expect(() => createChannelName("a".repeat(101))).toThrow(
    "exceeds the Discord channel name limit",
  );
});
