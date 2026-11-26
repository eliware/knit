import escapeDiscordLinkTarget from "../../src/notifier/link-target-encoding.mjs";

test("encodes characters that can break Discord link targets", () => {
  expect(escapeDiscordLinkTarget("https://example.test/a) b\\c")).toBe(
    "https://example.test/a%29%20b%5Cc",
  );
});
