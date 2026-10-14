import { createPushEmbed } from "../../src/notifier/pushEmbed.mjs";

test("creates a push embed with file changes", () => {
  const embed = createPushEmbed({
    post: {
      ref: "refs/heads/main",
      repository: { full_name: "eliware/knit" },
      commits: [{ id: "123456789", message: "change", added: ["file"] }],
    },
  });

  expect(embed.fields).toEqual([{ name: "New (1)", value: "file", inline: false }]);
  expect(embed.description).toContain("1234567");
});
