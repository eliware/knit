import { COLORS, createEmbed } from "../src/specializedEventEmbed.mjs";
import { escapeDiscordMarkdown } from "../src/notifier/discordMarkdown.mjs";

test("uses the configured color for each specialized event", () => {
  for (const [event, color] of Object.entries(COLORS)) {
    expect(createEmbed({ event, post: {} }).color).toBe(color);
  }
});

test("builds release embed fields and event links", () => {
  const embed = createEmbed({
    event: "release",
    post: {
      action: "published",
      repository: { full_name: "eliware/app", html_url: "repo" },
      sender: { login: "alice" },
      release: { name: "v1.2.3", html_url: "release" },
    },
  });
  expect(embed.title).toContain("release published");
  expect(embed.description).toContain("v1.2.3");
  expect(embed.url).toBe("release");
});

test("adds workflow conclusion and status to embed text", () => {
  const embed = createEmbed({
    event: "workflow_run",
    post: {
      action: "completed",
      repository: { full_name: "eliware/app" },
      workflow_run: { name: "CI", conclusion: "success", status: "completed" },
    },
  });
  expect(embed.description).toContain("Conclusion: **success**");
  expect(embed.description).toContain("Status: **completed**");
});

test("uses fallback repository, actor, action, and event color", () => {
  const embed = createEmbed({ event: "unknown", post: {} });
  expect(embed.title).toBe("Unknown Repository: unknown updated");
  expect(embed.description).toBe("Actor: **unknown**");
  expect(embed.color).toBe(0x3498db);
  expect(embed).not.toHaveProperty("url");
});

test.each([
  [{ sender: { name: "sender-name" } }, "sender-name"],
  [{ pusher: { name: "pusher-name" } }, "pusher-name"],
])("selects actor fallback from event data", (post, expected) => {
  expect(createEmbed({ event: "issues", post }).description).toContain(
    `Actor: **${escapeDiscordMarkdown(expected)}**`,
  );
});

test("uses repository URL and supported event names", () => {
  for (const field of ["title", "display_title", "environment", "ref"]) {
    const embed = createEmbed({
      event: "pull_request",
      post: { repository: { html_url: "repository" }, issue: { [field]: field } },
    });
    expect(embed.description).toContain(`**${escapeDiscordMarkdown(field)}**`);
    expect(embed.url).toBe("repository");
  }
  expect(createEmbed({ event: "deployment", post: { deployment: { url: "deploy" } } }).url).toBe(
    "deploy",
  );
  const status = createEmbed({
    event: "deployment_status",
    post: { deployment_status: { state: "active", status: "in_progress" } },
  });
  expect(status.description).toContain("State: **active**");
  expect(status.description).toContain(`Status: **${escapeDiscordMarkdown("in_progress")}**`);
});

test("escapes repository-controlled Markdown and special mentions", () => {
  const embed = createEmbed({
    event: "issues",
    post: {
      action: "opened",
      repository: { full_name: "eliware/app" },
      sender: { login: "@everyone" },
      issue: { title: "**urgent** @here" },
    },
  });
  expect(embed.description).toContain("\\*\\*urgent\\*\\*");
  expect(embed.description).toContain("@\u200beveryone");
  expect(embed.description).toContain("@\u200bhere");
});
