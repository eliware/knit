import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
import { consume } from "../src/consumer.mjs";
import { setPresenceManager } from "../src/presenceManager.mjs";
import { createConsumerHarness } from "../test-fixtures/consumerHarness.mjs";

describe("consumer.mjs", () => {
  let log;
  let Repo;
  let GitHub;
  let Router;
  let Handlers;
  let message;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ log, Repo, GitHub, Router, Handlers, message } = createConsumerHarness());
    setPresenceManager(null);
  });
  it("dispatches non-push events with the delivery id", async () => {
    const presence = { begin: jest.fn(), update: jest.fn(), terminal: jest.fn(), end: jest.fn() };
    setPresenceManager(presence);
    message.event = "issues";
    Router.resolveEventTarget.mockResolvedValue({
      ignored: false,
      repo: { update: jest.fn() },
      name: "foo",
    });
    Handlers.dispatch.mockResolvedValue(true);

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(true);
    expect(log.info).toHaveBeenCalledWith(
      "[Consumer] Non-push event routed for specialized handling",
      { event: "issues", repository: "foo", ref: null, deliveryId: "delivery-1" },
    );
    expect(Handlers.dispatch).toHaveBeenCalledWith({
      event: "issues",
      post: message.parsed,
      target: expect.any(Object),
      deliveryId: "delivery-1",
      log,
    });
    expect(presence.terminal).toHaveBeenCalledWith("completed foo", false, "delivery-1");
  });
  it("reports failed non-push handlers through presence", async () => {
    const presence = { begin: jest.fn(), update: jest.fn(), terminal: jest.fn(), end: jest.fn() };
    setPresenceManager(presence);
    message.event = "issues";
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: {}, name: "foo" });
    Handlers.dispatch.mockResolvedValue(false);
    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(presence.terminal).toHaveBeenCalledWith("failed foo", true, "delivery-1");
    expect(presence.end).toHaveBeenCalled();
  });
  it("logs specialized handler failures when optional error details are absent", async () => {
    message.event = "issues";
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: {}, name: "foo" });
    Handlers.dispatch.mockRejectedValue(undefined);

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(log.error).toHaveBeenCalledWith(
      "[Consumer] Webhook processing failed",
      expect.objectContaining({ repository: "foo", ref: null, stage: "event_handler", error: "" }),
    );
  });
  it.each([
    { ignored: true, kind: "repository", name: "foo" },
    { ignored: true, kind: "organization", name: null },
  ])("reports ignored non-push targets", async (target) => {
    message.event = "issues";
    Router.resolveEventTarget.mockResolvedValue(target);

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    if (target.kind === "repository") {
      expect(log.error).toHaveBeenCalledWith(
        "[Consumer] Repository target not found",
        expect.objectContaining({ repository: "foo", stage: "target_lookup" }),
      );
    } else {
      expect(log.info).toHaveBeenCalledWith("[Consumer] Event ignored: no configured target", null);
    }
  });
  it("uses default logger and GitHub modules when omitted", async () => {
    GitHub.validate.mockReturnValue(false);
    await expect(consume({ message, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(GitHub.validate).toHaveBeenCalledWith({
      post: message.parsed,
      event: "push",
      log: expect.anything(),
    });
    message.parsed = null;
    await expect(consume({ message, log, Repo, Router, Handlers })).resolves.toBe(false);
    expect(log.error).toHaveBeenCalledWith("[Consumer] GitHub validation failed");
  });
  it("uses default repository and router modules when omitted", async () => {
    await expect(consume({ message, log, GitHub })).resolves.toBe(false);
    expect(log.error).toHaveBeenCalledWith(
      "[Consumer] Repository update failed",
      expect.objectContaining({ repository: "foo", stage: "target_lookup" }),
    );
  });
  it("returns a failure when presence setup rejects", async () => {
    const presence = {
      begin: jest.fn().mockRejectedValue(new Error("presence failed")),
      terminal: jest.fn().mockRejectedValue(new Error("presence failed")),
      end: jest.fn(),
    };
    setPresenceManager(presence);

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(presence.end).toHaveBeenCalledWith("delivery-1");
  });
  it("uses the default event handlers when no handlers module is provided", async () => {
    message.event = "issues";
    Router.resolveEventTarget.mockResolvedValue({
      ignored: false,
      repo: { update: jest.fn() },
      name: "foo",
    });

    await expect(consume({ message, log, Repo, GitHub, Router })).resolves.toBe(true);
  });
});
