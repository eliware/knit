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

test("uses sender or owner avatars and fallback repository data", () => {
  const sender = createReleaseEmbed({
    ref: "refs/tags/v1 beta",
    repository: {},
    sender: { avatar_url: "sender.png" },
  });
  expect(sender.author).toEqual({ name: "unknown", icon_url: "sender.png" });
  expect(sender.url).toContain("v1%20beta");
  const owner = createReleaseEmbed({
    ref: "refs/tags/v1",
    repository: { full_name: "o/r", owner: { avatar_url: "owner.png" } },
  });
  expect(owner.author.icon_url).toBe("owner.png");
  const fallback = createReleaseEmbed({ ref: "refs/tags/v1", repository: {} });
  expect(fallback).toMatchObject({
    title: "Unknown Repository v1 has been released! 🎉",
    url: "https://github.com/Unknown Repository/releases/tag/v1",
    author: { name: "unknown" },
  });
  expect(fallback.author).not.toHaveProperty("icon_url");
  expect(fallback.author).not.toHaveProperty("url");
});

test("encodes path delimiters in the profile URL", () => {
  const embed = createReleaseEmbed({
    ref: "refs/tags/v1",
    pusher: { name: "person/other?tab=code" },
  });
  expect(embed.author.url).toBe("https://github.com/person%2Fother%3Ftab%3Dcode");
});
