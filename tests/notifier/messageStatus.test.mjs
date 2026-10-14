import { applyMessageStatus } from "../../src/notifier/messageStatus.mjs";

test("adds success status to a message title", () => {
  const message = { title: "Deploy" };
  expect(applyMessageStatus(message, false)).toEqual({ title: "✅ Deploy" });
});

test("adds error status and color to a message", () => {
  const message = { title: "Deploy" };
  expect(applyMessageStatus(message, true)).toEqual({ title: "❌ Error: Deploy", color: 0xff0000 });
});
