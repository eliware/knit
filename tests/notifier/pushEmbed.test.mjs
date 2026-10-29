import { createPushEmbed } from "../../src/notifier/pushEmbed.mjs";

test("returns no push embed when the event has no commits", () => {
  expect(createPushEmbed({})).toBeNull();
  expect(createPushEmbed({ post: { action: "opened" } })).toBeNull();
});

test("creates a push embed with file changes", () => {
  const embed = createPushEmbed({
    post: {
      ref: "refs/heads/main",
      repository: { full_name: "eliware/knit" },
      commits: [{ id: "123456789", message: "change", added: ["file"] }],
    },
  });

  expect(embed.fields).toEqual([{ name: "New (1)", value: "file", inline: false }]);
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
});

test("handles malformed change lists", () => {
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
  expect(embed.fields).toEqual([{ name: "Modified (1)", value: "same", inline: false }]);
});
