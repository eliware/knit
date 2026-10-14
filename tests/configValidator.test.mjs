import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { selectWorkflowAction, validateWorkflow } from "../src/configValidator.mjs";

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
test("selects push and matching tag actions without tag fallback", () => {
  const push = { deployments: [] };
  const release = { deployments: [{ target: "dev", cwd: "/opt/release", commands: ["release"] }] };
  const config = { on: { push, tags: { "v*": release } } };
  expect(selectWorkflowAction({ config, post: { ref: "refs/heads/main" } })).toBe(push);
  expect(selectWorkflowAction({ config, post: { ref: "refs/tags/v1.0.0" } })).toBe(release);
  expect(selectWorkflowAction({ config, post: { ref: "refs/tags/test" } })).toBeNull();
});
test("ignores tags when release actions are not configured", () =>
  expect(
    selectWorkflowAction({
      config: { on: { push: { deployments: [] } } },
      post: { ref: "refs/tags/v1.0.0" },
    }),
  ).toBeNull());
test("uses default inputs for workflow and target validation", () => {
  expect(validateWorkflow({})).toBe(false);
  expect(selectWorkflowAction({ config: { on: { push: [] } } })).toEqual([]);
  expect(() => selectWorkflowAction()).toThrow();
});
