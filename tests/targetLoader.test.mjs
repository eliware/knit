import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { target } from "../test-fixtures/repo.mjs";
import __knitModule0 from "../src/targetLoader.mjs";
const { createTargetLoader } = __knitModule0;
const inventoryYaml = [
  "guildId: guild",
  "targets:",
  "  dev:",
  ...Object.entries(target).map(([field, value]) => `    ${field}: ${value}`),
].join("\n");
test("loads and caches the trusted target inventory", () => {
  const fsModule = {
    readFileSync: jest.fn().mockReturnValue(inventoryYaml),
    accessSync: jest.fn(),
    statSync: jest.fn().mockReturnValue({
      isFile: () => true,
    }),
  };
  const loader = createTargetLoader({
    targetsPath: "/targets.yaml",
    fsModule,
  });
  expect(loader.load()).toEqual({
    guildId: "guild",
    targets: {
      dev: target,
    },
  });
  expect(loader.load()).toBe(loader.load());
  expect(fsModule.readFileSync).toHaveBeenCalledTimes(1);
});
test("checks that SSH paths are readable files before startup", () => {
  const fsModule = {
    readFileSync: jest.fn().mockReturnValue(inventoryYaml),
    accessSync: jest.fn(),
    statSync: jest.fn().mockReturnValue({
      isFile: () => true,
    }),
  };
  const loader = createTargetLoader({
    targetsPath: "/targets.yaml",
    fsModule,
  });
  expect(loader.validateAll()).toBe(true);
  expect(fsModule.accessSync).toHaveBeenCalledTimes(3);
  expect(fsModule.accessSync).toHaveBeenCalledWith("/key", expect.any(Number));
});
test("rejects unreadable or non-file SSH paths", () => {
  const fsModule = {
    readFileSync: jest.fn().mockReturnValue(inventoryYaml),
    accessSync: jest.fn((file) => {
      if (file === "/known") throw new Error("unreadable");
    }),
    statSync: jest.fn().mockReturnValue({
      isFile: () => true,
    }),
  };
  const error = jest.fn();
  const loader = createTargetLoader({
    targetsPath: "/targets.yaml",
    fsModule,
    log: {
      error,
    },
  });
  expect(loader.validateAll()).toBe(false);
  expect(error).toHaveBeenCalledWith(
    "ConfigValidator::validateTargets failed: invalid SSH file path",
  );
});
test("rejects an invalid target inventory", () => {
  const loader = createTargetLoader({
    fsModule: {
      readFileSync: jest.fn().mockReturnValue("targets: {}"),
    },
  });
  expect(loader.validateAll()).toBe(false);
});
