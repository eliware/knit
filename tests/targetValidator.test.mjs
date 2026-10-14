import { jest } from "@jest/globals";
import { validateTargets } from "../src/targetValidator.mjs";

const target = { host: "dev", user: "root", identity: "/key", knownHosts: "/known", hostCa: "/ca" };

test("accepts a complete trusted target inventory", () => {
  expect(validateTargets({ config: { guildId: "guild", targets: { dev: target } } })).toBe(true);
});

test("rejects a missing or incomplete target inventory", () => {
  const error = jest.fn();
  expect(validateTargets({ config: {}, log: { error } })).toBe(false);
  expect(
    validateTargets({
      config: { guildId: "guild", targets: { dev: { host: "dev" } } },
      log: { error },
    }),
  ).toBe(false);
  expect(error).toHaveBeenCalledTimes(2);
});

test("rejects target arrays", () => {
  expect(
    validateTargets({
      config: { guildId: "guild", targets: [target] },
      log: { error: jest.fn() },
    }),
  ).toBe(false);
});
