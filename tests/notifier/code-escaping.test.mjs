import escapeDiscordCode from "../../src/notifier/code-escaping.mjs";

test("replaces code fences in Discord text", () => {
  expect(escapeDiscordCode("before```after")).toBe("beforeˋˋˋafter");
});
