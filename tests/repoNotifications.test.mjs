import { jest } from "@jest/globals";
import { notifyPush, notifyTag } from "../src/repoNotifications.mjs";

const values = {
  repo: {},
  body: { ref: "refs/tags/v12.0.0" },
  event: "push",
  packageJson: {},
  log: {},
};

test("uses the injected tag notification handler", async () => {
  const notifyFn = jest.fn();

  await notifyTag({ ...values, notifyFn });

  expect(notifyFn).toHaveBeenCalledWith({
    repo: values.repo,
    body: values.body,
    event: values.event,
    logOutput: "",
    hasError: false,
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
