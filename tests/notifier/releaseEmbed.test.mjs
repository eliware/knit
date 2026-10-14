import { createReleaseEmbed } from "../../src/notifier/releaseEmbed.mjs";

test("creates a release embed with a tag link", () => {
  const embed = createReleaseEmbed({
    ref: "refs/tags/v12.0.0",
    repository: { full_name: "eliware/knit" },
  });

  expect(embed.title).toContain("knit v12.0.0");
  expect(embed.url).toContain("releases/tag/v12.0.0");
});
test("uses a repository fallback when no repository name exists", () => {
  expect(createReleaseEmbed({ ref: "refs/tags/" }).url).toBe("");
});
