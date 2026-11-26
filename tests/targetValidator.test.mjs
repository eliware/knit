import { jest } from "@jest/globals";
import { target } from "../test-fixtures/repo.mjs";
import __knitModule0 from "../src/targetValidator.mjs";
const { validateTargets } = __knitModule0;
test("accepts a complete trusted target inventory", () => {
  expect(
    validateTargets({
      config: {
        guildId: "guild",
        targets: {
          dev: target,
        },
      },
    }),
  ).toBe(true);
});
test("rejects missing, incomplete, or array target inventories", () => {
  const error = jest.fn();
  const invalidConfigs = [
    {},
    {
      guildId: "guild",
      targets: {
        dev: {
          host: "dev",
        },
      },
    },
    {
      guildId: "guild",
      targets: [target],
    },
  ];
  for (const config of invalidConfigs)
    expect(
      validateTargets({
        config,
        log: {
          error,
        },
      }),
    ).toBe(false);
  expect(error).toHaveBeenCalledTimes(invalidConfigs.length);
});
