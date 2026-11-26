import { jest } from "@jest/globals";
import __knitModule0 from "../../src/repo/factory.mjs";
import __knitModule1 from "../../src/repo.mjs";
const { createSshRepo } = __knitModule0;
const { updateSshRepo } = __knitModule1;

test("creates a repository with empty deployment defaults", async () => {
  const log = {
    error: jest.fn(),
  };
  const repo = createSshRepo({ log });

  expect(repo.targets).toEqual([]);
  await expect(repo.update({ body: {} })).resolves.toBe(false);
  expect(log.error).toHaveBeenCalledWith("[Repo] body validation failed");
});

test("defaults update event, delivery ID, and request logger", async () => {
  const log = { error: jest.fn() };
  await expect(
    updateSshRepo({
      repo: {},
      config: { deployments: [] },
      targets: {},
      sshExec: jest.fn(),
      stopOnError: true,
      log,
      body: {},
    }),
  ).resolves.toBe(false);
  expect(log.error).toHaveBeenCalledWith("[Repo] body validation failed");
});
