import * as limits from "../../src/notifier/embedLimits.mjs";
import { prepareNotificationMessage } from "../../src/notifier/message.mjs";

describe("Discord embed size limits", () => {
  it("keeps the tail of oversized logs and stays within description limit", async () => {
    const log = `${"old line\n".repeat(1000)}FINAL ERROR LINE`;
    const embed = await prepareNotificationMessage({
      post: {},
      event: "push",
      hasError: true,
      logOutput: log,
    });
    expect(embed.description.length).toBeLessThanOrEqual(4096);
    expect(embed.description).toContain("FINAL ERROR LINE");
    expect(embed.description).toContain("truncated; showing log tail");
  });

  it("handles tail helper edge cases and limits field count and values", () => {
    expect(limits.tail("short", 20)).toBe("short");
    expect(limits.tail("abcdef", 2)).toBe("ef");
    const embed = limits.limitEmbed({
      title: "x",
      description: "short",
      fields: Array.from({ length: 30 }, () => ({
        name: "n".repeat(300),
        value: "v".repeat(2000),
      })),
    });
    expect(embed.fields).toHaveLength(25);
    expect(
      embed.fields.every((field) => field.value.length <= 1024 && field.name.length <= 256),
    ).toBe(true);
  });

  it("limits the full embed text budget", () => {
    const embed = limits.limitEmbed({
      title: "t".repeat(256),
      description: "tail-marker-" + "x".repeat(7000),
      footer: { text: "f".repeat(2048) },
    });
    const total = embed.title.length + embed.description.length + embed.footer.text.length;
    expect(total).toBeLessThanOrEqual(6000);
    expect(embed.description).toContain("xxxxxxxx");
  });
});

test("covers empty and null values in embed limit helpers", () => {
  expect(limits.tail(null, 10)).toBe("");
  const embed = limits.limitEmbed({ fields: [{ name: "", value: "" }] });
  expect(embed.fields).toEqual([{ name: "", value: "" }]);
});
