import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { createSshRepo } from "../src/repo.mjs";
import { setPresenceManager } from "../src/presenceManager.mjs";
import { body, deployment, target } from "../test-fixtures/repo.mjs";
test("executes repository workflow against the named trusted target", async () => {
  setPresenceManager({ update: jest.fn(), terminal: jest.fn(), end: jest.fn() });
  const sshExec = jest.fn().mockResolvedValue([
    { command: "one", result: "out\n", code: 0 },
    { command: "two", result: "", code: 0 },
  ]);
  const repo = createSshRepo({
    config: { deployments: [deployment()] },
    targets: { dev: target },
    sshExec,
  });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenCalledWith(
    expect.objectContaining({
      host: "host",
      username: "user",
      cwd: "/opt/app",
      commands: [expect.stringContaining("; one"), expect.stringContaining("; two")],
      privateKeyPath: "/key",
      knownHostsPath: "/known",
      hostCaPath: "/ca",
    }),
  );
});

test("uses different command sets and directories per target", async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({
    config: {
      deployments: [
        deployment(),
        deployment({ target: "nas", cwd: "/opt/app", commands: ["deploy"] }),
      ],
    },
    targets: { dev: target, nas: { ...target, host: "nas" } },
    sshExec,
  });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      host: "nas",
      cwd: "/opt/app",
      commands: [expect.stringContaining("; deploy")],
    }),
  );
});

test("reports command failures and stops by default", async () => {
  const sshExec = jest.fn().mockResolvedValue([{ command: "one", result: "failed", code: 2 }]);
  const notify = jest.fn();
  const repo = createSshRepo({
    config: { deployments: [deployment(), deployment({ target: "nas" })] },
    targets: { dev: target, nas: target },
    sshExec,
    sendNotification: notify,
  });
  await expect(repo.update({ body })).resolves.toBe(false);
  expect(sshExec).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: true }));
});

test("rejects unknown targets before execution", async () => {
  const sshExec = jest.fn();
  const repo = createSshRepo({
    config: { deployments: [deployment({ target: "unknown" })] },
    targets: { dev: target },
    sshExec,
  });
  await expect(repo.update({ body })).rejects.toThrow("Unknown deployment target");
  expect(sshExec).not.toHaveBeenCalled();
});

test("rejects cwd outside the trusted target root", async () => {
  const sshExec = jest.fn();
  const repo = createSshRepo({
    config: { deployments: [deployment({ cwd: "/outside/app" })] },
    targets: { dev: { ...target, allowedCwdRoot: "/opt" } },
    sshExec,
  });
  await expect(repo.update({ body })).rejects.toThrow("outside target root");
  expect(sshExec).not.toHaveBeenCalled();
});

test("allows any absolute cwd when the trusted target root is filesystem root", async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({
    config: { deployments: [deployment({ cwd: "/opt/knit" })] },
    targets: { dev: { ...target, allowedCwdRoot: "/" } },
    sshExec,
  });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenCalled();
});

test("handles invalid bodies, tags, connection errors, and continue-on-error", async () => {
  const sshExec = jest
    .fn()
    .mockRejectedValueOnce(Object.assign(new Error("offline"), { stdout: "out", stderr: "err" }))
    .mockResolvedValueOnce([{ command: "deploy", result: "", code: 1 }])
    .mockResolvedValueOnce([{ command: "later", result: "ok", code: 0 }]);
  const notify = jest.fn();
  const repo = createSshRepo({
    config: {
      stopOnError: false,
      deployments: [
        deployment({ commands: ["first"] }),
        deployment({ target: "nas", commands: ["second"] }),
        deployment({ target: "nas", commands: ["third"] }),
      ],
    },
    targets: { dev: target, nas: target },
    sshExec,
    sendNotification: notify,
  });
  await expect(repo.update({ body: {} })).resolves.toBe(false);
  await expect(repo.update({ body: { ref: "refs/tags/v1", commits: [] } })).resolves.toBe(true);
  await expect(repo.update({ body })).resolves.toBe(false);
  expect(sshExec).toHaveBeenCalledTimes(3);
  expect(notify).toHaveBeenCalled();
});
test("uses the shared notifier for tag notifications", async () => {
  const repo = createSshRepo({ config: { deployments: [] }, targets: {} });
  const notifier = await import("../src/notifier/index.mjs");
  const client = {
    channels: {
      fetch: jest.fn().mockResolvedValue({ send: jest.fn().mockResolvedValue(undefined) }),
    },
  };
  notifier.setDiscordClient(client);
  notifier.setChannelResolver(jest.fn().mockResolvedValue("channel"));
  await expect(
    repo.update({ body: { ref: "refs/tags/v1", commits: [], repository: { full_name: "o/r" } } }),
  ).resolves.toBe(true);
  expect(createSshRepo().targets).toEqual([]);
});
