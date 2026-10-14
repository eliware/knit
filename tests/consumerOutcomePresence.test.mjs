import { jest } from "@jest/globals";
import { finishConsumerOutcome } from "../src/consumerOutcomePresence.mjs";

const createPresence = () => ({ terminal: jest.fn(), neutral: jest.fn(), end: jest.fn() });

test.each(["validation-failed", "processing-error"])(
  "finishes %s as a repository failure",
  async (type) => {
    const presence = createPresence();
    await expect(
      finishConsumerOutcome({
        presence,
        outcome: { type },
        repository: "owner/repo",
        deliveryId: "delivery-1",
      }),
    ).resolves.toBe(false);
    expect(presence.terminal).toHaveBeenCalledWith("owner/repo failure", true, "delivery-1");
    expect(presence.end).toHaveBeenCalledTimes(1);
  },
);

test("finishes an ignored tag as neutral and returns true", async () => {
  const presence = createPresence();
  await expect(
    finishConsumerOutcome({
      presence,
      outcome: { type: "ignored-target" },
      repository: "owner/repo",
      deliveryId: "delivery-1",
      post: { ref: "refs/tags/v1.0.0" },
    }),
  ).resolves.toBe(true);
  expect(presence.neutral).toHaveBeenCalledWith("owner/repo ignored", "delivery-1");
  expect(presence.terminal).not.toHaveBeenCalled();
});

test("finishes an ignored branch as a failure and returns false", async () => {
  const presence = createPresence();
  await expect(
    finishConsumerOutcome({
      presence,
      outcome: { type: "ignored-target" },
      repository: "owner/repo",
      post: { ref: "refs/heads/main" },
    }),
  ).resolves.toBe(false);
  expect(presence.terminal).toHaveBeenCalledWith("owner/repo failure", true, undefined);
});

test.each([
  ["specialized", true, "completed owner/repo", false],
  ["specialized", false, "failed owner/repo", true],
  ["push", true, "owner/repo success", false],
  ["push", false, "owner/repo failure", true],
])("maps %s result %s to presence", async (type, result, text, failed) => {
  const presence = createPresence();
  await expect(
    finishConsumerOutcome({
      presence,
      outcome: { type, result },
      repository: "owner/repo",
      deliveryId: "delivery-1",
    }),
  ).resolves.toBe(result);
  expect(presence.terminal).toHaveBeenCalledWith(text, failed, "delivery-1");
});

test("rejects unknown consumer outcomes", async () => {
  await expect(
    finishConsumerOutcome({ outcome: { type: "unknown" }, repository: "owner/repo" }),
  ).rejects.toThrow("Unknown consumer outcome: unknown");
});
