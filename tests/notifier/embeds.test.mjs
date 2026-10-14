import { createEmbed } from "../../src/notifier/embeds.mjs";

test("routes tags, pushes, and generic events to the matching embed rules", () => {
  expect(createEmbed({ post: { ref: "refs/tags/v1", repository: {} } }).title).toContain(
    "has been released",
  );
  expect(createEmbed({ post: { commits: [], repository: {} } }).footer.text).toBe(
    "GitHub Push Event",
  );
  expect(createEmbed({ post: { action: "opened" }, event: "issues" }).title).toBe(
    "Unknown Repository - issues: opened",
  );
});

test("uses default embed inputs", () => {
  expect(createEmbed()).toMatchObject({ title: "Unknown Repository - Event" });
  expect(createEmbed({ post: undefined })).toMatchObject({ title: "Unknown Repository - Event" });
});
