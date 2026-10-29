import { jest } from "@jest/globals";
import { isTagUpdate, notifyPush, notifyTag, notifyUpdate } from "../src/repoNotifications.mjs";

const values = {
  repo: {},
  body: { ref: "refs/tags/v15.0.1" },
  event: "push",
  packageJson: {},
  log: {},
};

test("classifies tag updates", () => {
  expect(isTagUpdate(values.body)).toBe(true);
  expect(isTagUpdate({ ref: "refs/heads/main" })).toBe(false);
  expect(isTagUpdate({})).toBe(false);
});

test("routes tag and push updates with the expected notification fields", async () => {
  const notifyFn = jest.fn();
  await notifyUpdate({ ...values, notifyFn });
  expect(notifyFn).toHaveBeenCalledTimes(1);
  expect(notifyFn).toHaveBeenLastCalledWith({
    repo: values.repo,
    body: values.body,
    event: values.event,
    logOutput: "",
    hasError: false,
    log: values.log,
  });

  await notifyUpdate({
    ...values,
    body: { ref: "refs/heads/main" },
    notifyFn,
    output: "out",
    failed: true,
  });
  expect(notifyFn).toHaveBeenLastCalledWith({
    repo: values.repo,
    body: { ref: "refs/heads/main" },
    logOutput: "out",
    hasError: true,
    log: values.log,
  });
});

test("uses the notifier module when no handler is injected", async () => {
  const NotifierMod = { send: jest.fn() };

  await notifyTag({ ...values, NotifierMod });

  expect(NotifierMod.send).toHaveBeenCalledWith({
    post: values.body,
    packageJson: values.packageJson,
    event: values.event,
    logOutput: "",
    hasError: false,
    log: values.log,
  });
});

test("uses the injected handler for push notifications", async () => {
  const notifyFn = jest.fn();
  await notifyPush({
    ...values,
    notifyFn,
    output: "deploy log",
    failed: true,
  });
  expect(notifyFn).toHaveBeenCalledWith({
    repo: values.repo,
    body: values.body,
    logOutput: "deploy log",
    hasError: true,
    log: values.log,
  });
});

test("uses the notifier module for push notifications without a handler", async () => {
  const NotifierMod = { send: jest.fn() };
  await notifyPush({
    ...values,
    NotifierMod,
    output: "deploy log",
    failed: false,
  });
  expect(NotifierMod.send).toHaveBeenCalledWith({
    post: values.body,
    packageJson: values.packageJson,
    event: values.event,
    logOutput: "deploy log",
    hasError: false,
    log: values.log,
  });
});
