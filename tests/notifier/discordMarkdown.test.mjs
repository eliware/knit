import __knitModule0 from "../../src/notifier/discordMarkdown.mjs";
const { escapeDiscordCode, escapeDiscordLinkTarget, escapeDiscordMarkdown } = __knitModule0;
test("escapes Discord markdown and special mentions", () => {
  expect(escapeDiscordMarkdown("[hello](https://example.test) @everyone")).toBe(
    "\\[hello\\]\\(https://example.test\\) @\u200beveryone",
  );
});
test("protects code blocks and link targets", () => {
  expect(escapeDiscordCode("before```after")).toBe("beforeˋˋˋafter");
  expect(escapeDiscordLinkTarget("https://example.test/a) b")).toBe(
    "https://example.test/a%29%20b",
  );
});
