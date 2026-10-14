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

test("merges file changes and error logs from push commits", () => {
  const embed = createPushEmbed({
    post: {
      ref: "refs/heads/main",
      repository: { full_name: "foo/bar", html_url: "url", owner: { avatar_url: "owner.png" } },
      pusher: { name: "bob" },
      commits: [
        {
          id: "123456789",
          message: "change",
          url: "commit",
          added: ["a"],
          removed: ["b"],
          modified: ["c"],
        },
      ],
      head_commit: {
        timestamp: "2025-01-01T00:00:00Z",
        added: ["c"],
        removed: ["d"],
        modified: ["e"],
      },
    },
    logOutput: "failure",
    hasError: true,
  });
  expect(embed.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "New (1)", value: "a" }),
      expect.objectContaining({ name: "Deleted (2)", value: "b\nd" }),
      expect.objectContaining({ name: "Modified (2)", value: "c\ne" }),
    ]),
  );
  expect(embed.author).toEqual({
    name: "bob",
    icon_url: "owner.png",
    url: "https://github.com/bob",
  });
  expect(embed.description).toContain("failure");
});

test("limits long descriptions and handles malformed change lists", () => {
  const longEmbed = createPushEmbed({
    post: {
      commits: Array.from({ length: 100 }, (_, index) => ({
        id: String(index).repeat(10),
        message: "x".repeat(100),
        url: "",
      })),
    },
  });
  expect(longEmbed.description.length).toBeLessThanOrEqual(1800);
  expect(longEmbed.description).toContain("...");
  const embed = createPushEmbed({
    post: {
      commits: [
        { id: "123", message: "", url: "", added: "bad", removed: [], modified: ["same"] },
        { added: ["same"] },
      ],
      head_commit: { added: "bad", removed: "bad", modified: "bad" },
      sender: { avatar_url: "sender.png" },
      repository: { full_name: "r/r", owner: {} },
      pusher: {},
    },
  });
  expect(embed.author).toEqual({ name: "unknown", icon_url: "sender.png" });
  expect(embed.fields).toEqual([{ name: "Modified (1)", value: "same", inline: false }]);
  expect(embed.description).toContain("**123**: []()");
});

test("supports a truthy string commit list", () => {
  expect(createPushEmbed({ post: { commits: "x" } }).description).toContain(
    "Branch: **unknown** - Commits: **1**",
  );
});
