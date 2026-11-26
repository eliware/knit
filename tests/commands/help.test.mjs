import path from "node:path";
import { jest } from "@jest/globals";
import { clearLocales, locales, setupLocales } from "@eliware/discord/locales";
import help from "../../src/commands/help.mjs";

const defaultHelpMessage =
  "Knit verifies signed GitHub webhooks, runs approved workflows through SSH, and sends updates to Discord. Find setup and usage guides at https://github.com/eliware/knit/tree/main/docs.";
const silentLogger = { warn: jest.fn(), error: jest.fn() };
const setup = () => {
  const { msg: lookup, loadedLocales } = setupLocales({ localesDir: path.resolve("locales") });
  const msg = (locale, key, fallback) => lookup(locale, key, fallback, silentLogger);
  return { msg, loadedLocales };
};

afterEach(() => clearLocales());

test("replies with the requested locale and complete help text", async () => {
  const { msg, loadedLocales } = setup();
  expect(loadedLocales).toHaveLength(32);
  for (const locale of loadedLocales) {
    const message = msg(locale, "help", defaultHelpMessage);
    expect(message).not.toBe("Shows Knit help.");
    expect(message).toContain("Knit");
    expect(message).toContain("https://github.com/eliware/knit/tree/main/docs");
  }

  const interaction = { locale: "fr", reply: jest.fn() };
  await help({ msg }, interaction);
  expect(interaction.reply).toHaveBeenCalledWith(locales.fr.help);
  expect(interaction.reply.mock.calls[0][0]).toContain(
    "https://github.com/eliware/knit/tree/main/docs",
  );
});

test("uses useful English help for an unknown locale", async () => {
  const { msg } = setup();
  const interaction = { locale: "xx-XX", reply: jest.fn() };
  await help({ msg }, interaction);
  expect(interaction.reply).toHaveBeenCalledWith(locales["en-US"].help);
  expect(interaction.reply.mock.calls[0][0]).toContain("signed GitHub webhooks");
  expect(interaction.reply.mock.calls[0][0]).not.toBe(
    "Learn what Knit does and find setup guides.",
  );
});

test("uses the useful default when the requested locale lacks the help key", async () => {
  const { msg } = setup();
  delete locales.fr.help;
  const interaction = { locale: "fr", reply: jest.fn() };
  await help({ msg }, interaction);
  expect(interaction.reply).toHaveBeenCalledWith(defaultHelpMessage);
});
