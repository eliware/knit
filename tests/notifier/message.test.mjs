import { prepareNotificationMessage } from "../../src/notifier/message.mjs";

test("clones provided embeds and applies success or error status", async () => {
  const embed = { title: "Deploy", fields: [{ name: "Log", value: "ok" }] };
  const success = await prepareNotificationMessage({ providedEmbed: embed, hasError: false });
  expect(success).toMatchObject({ title: "✅ Deploy", fields: [{ name: "Log", value: "ok" }] });
  expect(embed).toEqual({ title: "Deploy", fields: [{ name: "Log", value: "ok" }] });
  const failure = await prepareNotificationMessage({ providedEmbed: embed, hasError: true });
  expect(failure).toMatchObject({ title: "❌ Error: Deploy", color: 0xff0000 });
});

test("builds a success message from webhook data", async () => {
  const message = await prepareNotificationMessage({ post: {}, hasError: false });
  expect(message.title).toBe("✅ Unknown Repository - Event");
});
