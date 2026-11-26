import textLimit from "../../src/notifier/text-limit.mjs";

test("keeps short text unchanged", () => {
  expect(textLimit("short", 20)).toBe("short");
});

test("returns an empty string when no text can fit", () => {
  expect(textLimit("text", 0)).toBe("");
  expect(textLimit("text", -1)).toBe("");
  expect(textLimit(null, 10)).toBe("");
});

test("keeps the final characters when the marker cannot fit", () => {
  expect(textLimit("abcdef", 2)).toBe("ef");
});

test("uses the marker when it fits with the end of the text", () => {
  const text = textLimit(`${"old ".repeat(30)}FINAL`, 50);
  expect(text).toContain("truncated, showing log tail");
  expect(text).toContain("FINAL");
});
