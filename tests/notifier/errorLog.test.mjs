import { appendErrorLog, renderErrorLog } from "../../src/notifier/errorLog.mjs";

test("escapes code fences in the selected error log tail", () => {
  expect(renderErrorLog("failure ``` marker", 100)).toBe("```text\nfailure ˋˋˋ marker\n```");
});

test("bounds the rendered error log", () => {
  const rendered = renderErrorLog(`${"x".repeat(100)}END`, 20);
  expect(rendered.length).toBeLessThanOrEqual(32);
  expect(rendered).toContain("END");
});

test("adds an error log within the remaining description space", () => {
  const description = appendErrorLog("failure", `${"old\n".repeat(2000)}FINAL`);
  expect(description.length).toBeLessThanOrEqual(4096);
  expect(description).toContain("FINAL");
  expect(description).toContain("truncated, showing log tail");
});
