import { jest } from "@jest/globals";
import help from "../../src/commands/help.mjs";

test("replies with the localized help message", async () => {
  const context = { msg: jest.fn().mockReturnValue("Knit help") };
  const interaction = { locale: "en-US", reply: jest.fn() };

  await help(context, interaction);

  expect(context.msg).toHaveBeenCalledWith(
    "en-US",
    "help",
    "Knit handles signed GitHub events and deployment notifications.",
  );
  expect(interaction.reply).toHaveBeenCalledWith("Knit help");
});
