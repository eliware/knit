import __knitModule0 from "../../../src/discord/channel/name-policy.mjs";
const { validateChannelNameLength } = __knitModule0;

test("accepts a channel name at the Discord length limit", () => {
  const name = "a".repeat(100);
  expect(validateChannelNameLength(name)).toBe(name);
});

test("rejects a channel name longer than the Discord limit", () => {
  expect(() => validateChannelNameLength("a".repeat(101))).toThrow(
    "exceeds the Discord channel name limit",
  );
});
