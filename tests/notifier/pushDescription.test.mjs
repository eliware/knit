import { createPushDescription } from "../../src/notifier/pushDescription.mjs";

test("formats branch and commit details", () => {
  expect(
    createPushDescription({
      post: {
        ref: "refs/heads/main",
        commits: [{ id: "123456789", message: "change", url: "https://example.test/commit" }],
      },
    }),
  ).toBe("Branch: **main** - Commits: **1**\n**1234567**: [change](https://example.test/commit)");
});

test("escapes untrusted commit text and link targets", () => {
  expect(
    createPushDescription({
      post: {
        ref: "refs/heads/feature-@everyone",
        commits: [
          {
            id: "123456789",
            message: "](https://evil.test) @here",
            url: "https://github.com/owner/repo/commit/abc) (fake",
          },
        ],
      },
    }),
  ).toContain("\\]\\(https://evil.test\\) @\u200bhere");
});

test("truncates long commit descriptions", () => {
  const description = createPushDescription({
    post: {
      commits: Array.from({ length: 100 }, (_, index) => ({
        id: String(index).repeat(10),
        message: "x".repeat(100),
        url: "",
      })),
    },
  });
  expect(description.length).toBe(1800);
  expect(description.endsWith("...")).toBe(true);
});

test("adds the end of an error log within the Discord description limit", () => {
  const description = createPushDescription({
    post: { commits: [{ id: "123", message: "failure", url: "" }] },
    logOutput: `${"old line\n".repeat(1000)}FINAL ERROR LINE`,
    hasError: true,
  });
  expect(description.length).toBeLessThanOrEqual(4096);
  expect(description).toContain("FINAL ERROR LINE");
  expect(description).toContain("truncated, showing log tail");
});

test("supports a truthy string commit list", () => {
  expect(createPushDescription({ post: { commits: "x" } })).toContain(
    "Branch: **unknown** - Commits: **1**",
  );
});
