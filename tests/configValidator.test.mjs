import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { validateWorkflow } from "../src/configValidator.mjs";

test("accepts separate push and tag actions", () =>
  expect(
    validateWorkflow({
      config: {
        version: 1,
        on: {
          push: { deployments: [{ target: "dev", cwd: "/opt/app", commands: ["npm test"] }] },
          tags: {
            "v*": { deployments: [{ target: "dev", cwd: "/opt/app", commands: ["npm test"] }] },
          },
        },
      },
    }),
  ).toBe(true));
test("accepts bounded deployment timeouts and rejects unsafe values", () => {
  const base = {
    version: 1,
    on: {
      push: {
        deployments: [
          { target: "dev", cwd: "/opt/app", commands: ["npm test"], timeoutMs: 300000 },
        ],
      },
    },
  };
  expect(validateWorkflow({ config: base })).toBe(true);
  expect(
    validateWorkflow({
      config: {
        ...base,
        on: { push: { deployments: [{ ...base.on.push.deployments[0], timeoutMs: 300001 }] } },
      },
      log: { error: jest.fn() },
    }),
  ).toBe(false);
});
test("rejects legacy workflow shapes", () =>
  expect(
    validateWorkflow({ config: { repository: "o/r", targets: [] }, log: { error: jest.fn() } }),
  ).toBe(false));
test("uses default inputs for workflow validation", () => {
  expect(validateWorkflow({})).toBe(false);
});
