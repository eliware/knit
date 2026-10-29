import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { consume } from "../src/consumer.mjs";
import { setPresenceManager } from "../src/presenceManager.mjs";
import { createConsumerHarness } from "../test-fixtures/consumerHarness.mjs";

let log;
let Repo;
let GitHub;
let Router;
let Handlers;
let message;

beforeEach(() => {
  jest.clearAllMocks();
  ({ log, Repo, GitHub, Router, Handlers, message } = createConsumerHarness());
  message.parsed.ref = "refs/heads/main";
  setPresenceManager(null);
});

test("logs a repository target lookup failure", async () => {
  const target = { ignored: true, kind: "repository", name: "foo" };
  Router.resolveEventTarget.mockResolvedValue(target);

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
  expect(Router.resolveEventTarget).toHaveBeenCalledWith({
    post: message.parsed,
    event: "push",
    RepoMod: Repo,
    log,
  });
  expect(log.error).toHaveBeenCalledWith(
    "[Consumer] Repository update failed",
    expect.objectContaining({
      repository: "foo",
      ref: "refs/heads/main",
      deliveryId: "delivery-1",
      stage: "target_lookup",
      durationMs: expect.any(Number),
    }),
  );
});

test("marks an unmatched tag as neutral", async () => {
  const presence = { begin: jest.fn(), neutral: jest.fn(), terminal: jest.fn(), end: jest.fn() };
  setPresenceManager(presence);
  message.parsed.ref = "refs/tags/v15.0.1";
  Router.resolveEventTarget.mockResolvedValue({ ignored: true, kind: "repository", name: "foo" });

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(true);
  expect(presence.neutral).toHaveBeenCalledWith("foo ignored", "delivery-1");
  expect(presence.terminal).not.toHaveBeenCalled();
});

test("marks successful tag notices without reporting a deployment stage", async () => {
  message.parsed.ref = "refs/tags/v15.0.1";
  Router.resolveEventTarget.mockResolvedValue({
    ignored: false,
    repo: { update: jest.fn().mockResolvedValue(true) },
    name: "foo",
  });

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(true);
  expect(log.info).toHaveBeenCalledWith(
    "[Consumer] Repository update completed",
    expect.objectContaining({
      repository: "foo",
      ref: "refs/tags/v15.0.1",
      stage: "tag_notice",
    }),
  );
});

test.each([
  [false, "push"],
  [true, "push"],
  [true, undefined],
])("routes push updates and defaults missing event names", async (updated, event) => {
  if (event) message.event = event;
  else delete message.event;
  const update = jest.fn().mockResolvedValue(updated);
  Router.resolveEventTarget.mockResolvedValue({
    ignored: false,
    repo: { update },
    name: "foo",
  });

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(updated);
  expect(update).toHaveBeenCalledWith({
    body: message.parsed,
    event: "push",
    deliveryId: "delivery-1",
    log,
  });
  expect(log.info).toHaveBeenCalledWith("[Consumer] Repository update started", {
    repository: "foo",
    ref: "refs/heads/main",
    deliveryId: "delivery-1",
    stage: "target_lookup",
  });
  expect(updated ? log.info : log.error).toHaveBeenCalledWith(
    updated ? "[Consumer] Repository update completed" : "[Consumer] Repository update failed",
    expect.objectContaining({
      repository: "foo",
      ref: "refs/heads/main",
      deliveryId: "delivery-1",
      stage: "deployment",
      durationMs: expect.any(Number),
    }),
  );
});

test("reports route exceptions as terminal failures", async () => {
  const presence = { begin: jest.fn(), terminal: jest.fn(), end: jest.fn() };
  setPresenceManager(presence);
  Router.resolveEventTarget.mockRejectedValue(new Error("Authorization: Bearer sample-token"));

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
  expect(log.error).toHaveBeenCalledWith(
    "[Consumer] Repository update failed",
    expect.objectContaining({
      repository: "foo",
      deliveryId: "delivery-1",
      stage: "target_lookup",
      error: expect.not.stringContaining("sample-token"),
    }),
  );
  expect(presence.terminal).toHaveBeenCalledWith("foo failure", true, "delivery-1");
  expect(presence.end).toHaveBeenCalled();
});

test("logs an SSH error code when repository updates reject", async () => {
  const error = Object.assign(new Error("connection reset"), { code: "ECONNRESET" });
  Router.resolveEventTarget.mockResolvedValue({
    ignored: false,
    repo: { update: jest.fn().mockRejectedValue(error) },
    name: "foo",
  });

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
  expect(log.error).toHaveBeenCalledWith(
    "[Consumer] Repository update failed",
    expect.objectContaining({ errorCode: "ECONNRESET", stage: "deployment" }),
  );
});

test("does not route an organization push to a fallback repository", async () => {
  message.parsed = {};
  Router.resolveEventTarget.mockResolvedValue({
    ignored: true,
    kind: "organization",
    name: null,
  });

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
  expect(Handlers.dispatch).not.toHaveBeenCalled();
});

test("supports requests without a delivery ID", async () => {
  delete message.deliveryId;
  const presence = { begin: jest.fn(), terminal: jest.fn(), end: jest.fn() };
  setPresenceManager(presence);
  Router.resolveEventTarget.mockResolvedValue({ ignored: true, kind: "repository", name: "foo" });

  await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
  expect(presence.begin).toHaveBeenCalledWith("foo", null);
  expect(log.info).toHaveBeenCalledWith(
    "[Consumer] Repository update started",
    expect.objectContaining({ deliveryId: null }),
  );
});
