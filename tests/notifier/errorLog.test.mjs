import { renderErrorLog } from "../../src/notifier/errorLog.mjs";

test("escapes code fences in the selected error log tail", () => {
  expect(renderErrorLog("failure ``` marker", 100)).toBe("```text\nfailure ˋˋˋ marker\n```");
});

test("bounds the rendered error log", () => {
  const rendered = renderErrorLog(`${"x".repeat(100)}END`, 20);
  expect(rendered.length).toBeLessThanOrEqual(32);
  expect(rendered).toContain("END");
});
