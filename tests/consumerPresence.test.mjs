import { jest } from "@jest/globals";
import { finishConsumerPresence } from "../src/consumerPresence.mjs";

test("ends terminal outcomes with delivery context", async () => {
  const presence = { terminal: jest.fn(), end: jest.fn() };
  await finishConsumerPresence({
    presence,
    text: "repo failure",
    failed: true,
    deliveryId: "delivery-1",
  });
  expect(presence.terminal).toHaveBeenCalledWith("repo failure", true, "delivery-1");
  expect(presence.end).toHaveBeenCalledTimes(1);
});

test("sends ignored tags to neutral presence", async () => {
  const presence = { neutral: jest.fn(), terminal: jest.fn(), end: jest.fn() };
  await finishConsumerPresence({
    presence,
    text: "repo ignored",
    neutral: true,
    deliveryId: "delivery-1",
  });
  expect(presence.neutral).toHaveBeenCalledWith("repo ignored", "delivery-1");
  expect(presence.terminal).not.toHaveBeenCalled();
  expect(presence.end).toHaveBeenCalledTimes(1);
});

test("swallows a rejected async presence end", async () => {
  const presence = {
    terminal: jest.fn(),
    end: jest.fn().mockRejectedValue(new Error("end failed")),
  };
  await expect(
    finishConsumerPresence({ presence, text: "done", deliveryId: "delivery-1" }),
  ).resolves.toBeUndefined();
  expect(presence.end).toHaveBeenCalledWith("delivery-1");
});

test("accepts an absent presence manager", async () => {
  await expect(
    finishConsumerPresence({ text: "done", deliveryId: "delivery-1" }),
  ).resolves.toBeUndefined();
});
