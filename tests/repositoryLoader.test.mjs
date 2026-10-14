import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { get } from "../src/repositoryLoader.mjs";
import { createSshRepo } from "../src/repo.mjs";

const deployment = (overrides) => ({
  target: "dev",
  cwd: "/opt/app",
  commands: ["one", "two"],
  ...overrides,
});
const target = {
  host: "host",
  user: "user",
  identity: "/key",
  knownHosts: "/known",
  hostCa: "/ca",
};
const body = { commits: [{ id: "commit" }] };
test("loads, validates, and authorizes a repository workflow", async () => {
  const targetLoader = { load: jest.fn().mockReturnValue({ targets: { dev: target } }) };
  const workflowLoader = jest.fn().mockResolvedValue({
    workflow: {
      version: 1,
      on: {
        push: { deployments: [deployment()] },
        tags: { "v*": { deployments: [deployment()] } },
      },
    },
  });
  await expect(
    get({ name: "eliware/app", body: { after: "a".repeat(40) }, targetLoader, workflowLoader }),
  ).resolves.toBeDefined();
  expect(workflowLoader).toHaveBeenCalledWith({
    repository: "eliware/app",
    commit: "a".repeat(40),
  });
});

test("rejects malformed and unknown-target workflows", async () => {
  const targetLoader = { load: () => ({ targets: { dev: target } }) };
  await expect(
    get({
      name: "eliware/app",
      body: { after: "a".repeat(40) },
      targetLoader,
      workflowLoader: async () => ({
        workflow: {
          version: 1,
          on: { push: { deployments: [] }, tags: { "v*": { deployments: [deployment()] } } },
        },
      }),
    }),
  ).resolves.toBeNull();
  await expect(
    get({
      name: "eliware/app",
      body: { after: "a".repeat(40) },
      targetLoader,
      workflowLoader: async () => ({
        workflow: {
          version: 1,
          on: {
            push: { deployments: [deployment({ target: "missing" })] },
            tags: { "v*": { deployments: [deployment()] } },
          },
        },
      }),
    }),
  ).resolves.toBeNull();
});

test("supports the default notification path when no notifier is supplied", async () => {
  const repo = createSshRepo({ config: { deployments: [] }, targets: {} });
  await expect(repo.update({ body })).resolves.toBe(true);
});

test("rejects unauthorized repository workflows", async () => {
  const targetLoader = {
    load: () => ({ targets: { nas: { ...target, allowedRepositories: ["eliware/other"] } } }),
  };
  const workflowLoader = async () => ({
    workflow: {
      version: 1,
      on: {
        push: { deployments: [deployment({ target: "nas" })] },
        tags: { "v*": { deployments: [deployment()] } },
      },
    },
  });
  await expect(
    get({ name: "eliware/app", body: { after: "a".repeat(40) }, targetLoader, workflowLoader }),
  ).resolves.toBeNull();
});

test("ignores unmatched tags", async () => {
  const workflow = {
    version: 1,
    on: { push: { deployments: [deployment()] }, tags: { "v*": { deployments: [deployment()] } } },
  };
  await expect(
    get({
      name: "eliware/app",
      body: { after: "a".repeat(40), ref: "refs/tags/beta" },
      targetLoader: { load: () => ({ targets: { dev: target } }) },
      workflowLoader: async () => ({ workflow }),
    }),
  ).resolves.toBeNull();
});

test("uses an empty target map for notification events without target configuration", async () => {
  await expect(
    get({
      name: "eliware/app",
      event: "issues",
      body: {},
      targetLoader: { load: () => ({}) },
    }),
  ).resolves.toBeDefined();
});

test("uses default repository loader inputs", async () => {
  await expect(get()).resolves.toBeNull();
});
