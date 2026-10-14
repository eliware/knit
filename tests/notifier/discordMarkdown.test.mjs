import {
  escapeDiscordCode,
  escapeDiscordLinkTarget,
  escapeDiscordMarkdown,
} from "../../src/notifier/discordMarkdown.mjs";

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
