import { createGenericEmbed } from "../../src/notifier/genericEmbed.mjs";

test("creates a generic embed with error output", () => {
  const embed = createGenericEmbed({
    post: { action: "opened", repository: { full_name: "eliware/knit" } },
    event: "issues",
    logOutput: "failed",
    hasError: true,
  });

  expect(embed.title).toBe("eliware/knit - issues: opened");
  expect(embed.description).toContain("failed");
});

test("uses event names, actions, and defaults in the title", () => {
  expect(createGenericEmbed({ post: {} })).toMatchObject({
    title: "Unknown Repository - Event",
    description: "See details on GitHub for more information.",
  });
  expect(createGenericEmbed({ post: { action: "closed" }, event: "push" }).title).toBe(
    "Unknown Repository - closed",
  );
  expect(createGenericEmbed({ post: {}, event: "issues" }).title).toBe(
    "Unknown Repository - issues",
  );
  expect(createGenericEmbed({ post: { action: "opened" }, event: "issues" }).title).toBe(
    "Unknown Repository - issues: opened",
  );
  expect(
    createGenericEmbed({ post: {}, event: null, hasError: true, logOutput: "failure" }).description,
  ).toBe("See details on GitHub for more information.```text\nfailure\n```");
});
