import { selectWorkflowAction } from "../src/workflowActionSelector.mjs";

test("selects push and matching tag actions without tag fallback", () => {
  const push = { deployments: [] };
  const release = { deployments: [{ target: "dev", cwd: "/opt/release", commands: ["release"] }] };
  const config = { on: { push, tags: { "v*": release } } };
  expect(selectWorkflowAction({ config, post: { ref: "refs/heads/main" } })).toBe(push);
  expect(selectWorkflowAction({ config, post: { ref: "refs/tags/v1.0.0" } })).toBe(release);
  expect(selectWorkflowAction({ config, post: { ref: "refs/tags/test" } })).toBeNull();
});

test("ignores tags when release actions are not configured", () => {
  expect(
    selectWorkflowAction({
      config: { on: { push: { deployments: [] } } },
      post: { ref: "refs/tags/v1.0.0" },
    }),
  ).toBeNull();
});

test("matches version tags with the v shorthand", () => {
  const release = { deployments: [{ target: "dev", cwd: "/opt/release", commands: ["release"] }] };
  expect(
    selectWorkflowAction({
      config: { on: { tags: { v: release } } },
      post: { ref: "refs/tags/v1.2.3" },
    }),
  ).toBe(release);
});

test("uses the push action and requires workflow configuration", () => {
  expect(selectWorkflowAction({ config: { on: { push: [] } } })).toEqual([]);
  expect(() => selectWorkflowAction()).toThrow();
});
