import __knitModule0 from "../../src/notifier/discordMarkdown.mjs";
const { escapeDiscordMarkdown } = __knitModule0;
test("escapes Discord markdown and special mentions", () => {
  expect(escapeDiscordMarkdown("[hello](https://example.test) @everyone")).toBe(
    "\\[hello\\]\\(https://example.test) @\u200beveryone",
  );
});
test("preserves hyphens and converts encoded spaces", () => {
  expect(escapeDiscordMarkdown("Release v15.2.0 - 2026-11-26&#x20;ready&#32;now")).toBe(
    "Release v15.2.0 - 2026-11-26 ready now",
  );
});
test("keeps ordinary punctuation unescaped and blocks active line syntax", () => {
  expect(escapeDiscordMarkdown("chore(release): fix #20 + 2 ! {x} -> done")).toBe(
    "chore(release): fix #20 + 2 ! {x} -> done",
  );
  expect(escapeDiscordMarkdown("# Heading\n> quote\n- item\n+ item")).toBe(
    "\\# Heading\n\\> quote\n\\- item\n\\+ item",
  );
});
