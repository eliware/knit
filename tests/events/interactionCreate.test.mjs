import { jest } from "@jest/globals";
import interactionCreate from "../../src/events/interactionCreate.mjs";

test("dispatches a known chat command", async () => {
  const handler = jest.fn();
  const context = { commandHandlers: { help: handler } };
  const interaction = {
    commandName: "help",
    isChatInputCommand: jest.fn().mockReturnValue(true),
  };

  await expect(interactionCreate(context, interaction)).resolves.toBe(true);
  expect(handler).toHaveBeenCalledWith(context, interaction);
});

test("ignores non-command and unknown interactions", async () => {
  const context = { commandHandlers: {} };
  await expect(interactionCreate(context, { isChatInputCommand: () => false })).resolves.toBe(
    false,
  );
  await expect(
    interactionCreate(context, {
      commandName: "other",
      isChatInputCommand: () => true,
    }),
  ).resolves.toBe(false);
});
