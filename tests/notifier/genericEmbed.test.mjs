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
