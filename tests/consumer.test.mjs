import { jest } from '@jest/globals';
import { consume } from '../src/consumer.mjs';
import { setPresenceManager } from '../src/presenceManager.mjs';

describe('consumer.mjs', () => {
  const log = { error: jest.fn(), info: jest.fn() };
  let Repo;
  let GitHub;
  let Router;
  let Handlers;
  let message;

  beforeEach(() => {
    jest.clearAllMocks();
    Repo = { get: jest.fn() };
    GitHub = { validate: jest.fn().mockReturnValue(true) };
    Router = { resolveEventTarget: jest.fn() };
    Handlers = { dispatch: jest.fn() };
    message = { raw: '{}', parsed: { repository: { full_name: 'foo' } }, event: 'push', deliveryId: 'delivery-1' };
    setPresenceManager(null);
  });

  it('returns false and logs when GitHub validation fails', async () => {
    GitHub.validate.mockReturnValue(false);

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(GitHub.validate).toHaveBeenCalledWith({ post: message.parsed, event: 'push', log });
    expect(log.error).toHaveBeenCalledWith('[Consumer] GitHub validation failed');
    expect(Router.resolveEventTarget).not.toHaveBeenCalled();
  });

  it('returns false and logs when a repository target is missing', async () => {
    Router.resolveEventTarget.mockResolvedValue({ ignored: true, kind: 'repository', name: 'foo' });

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(Router.resolveEventTarget).toHaveBeenCalledWith({ post: message.parsed, RepoMod: Repo, log });
    expect(log.error).toHaveBeenCalledWith('[Consumer] Repo not found:', 'foo');
  });

  it('returns false and logs when an organization event has no fallback target', async () => {
    message.parsed = {};
    Router.resolveEventTarget.mockResolvedValue({ ignored: true, kind: 'organization', name: 'eliware/knit' });

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(log.info).toHaveBeenCalledWith('[Consumer] Event ignored: no configured target', 'eliware/knit');
  });

  it('does not dispatch organization-level events to a fallback repository', async () => {
    message.parsed = {};
    Router.resolveEventTarget.mockResolvedValue({ ignored: true, kind: 'organization', name: null });

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(Handlers.dispatch).not.toHaveBeenCalled();
  });

  it('dispatches non-push events with the delivery id', async () => {
    const presence = { begin: jest.fn(), update: jest.fn(), terminal: jest.fn(), end: jest.fn() };
    setPresenceManager(presence);
    message.event = 'issues';
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: { update: jest.fn() }, name: 'foo' });
    Handlers.dispatch.mockResolvedValue(true);

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(true);
    expect(log.info).toHaveBeenCalledWith('[Consumer] Non-push event routed for specialized handling', 'issues', 'foo');
    expect(Handlers.dispatch).toHaveBeenCalledWith({ event: 'issues', post: message.parsed, target: expect.any(Object), deliveryId: 'delivery-1', log });
    expect(presence.terminal).toHaveBeenCalledWith('completed foo', false);
  });

  it('reports failed non-push handlers through presence', async () => {
    const presence = { begin: jest.fn(), update: jest.fn(), terminal: jest.fn(), end: jest.fn() };
    setPresenceManager(presence);
    message.event = 'issues';
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: {}, name: 'foo' });
    Handlers.dispatch.mockResolvedValue(false);
    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(presence.terminal).toHaveBeenCalledWith('failed foo', true);
    expect(presence.end).toHaveBeenCalled();
  });

  it.each([false, true])('returns update result and logs appropriately when push update is %s', async (updated) => {
    const update = jest.fn().mockResolvedValue(updated);
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: { update }, name: 'foo' });

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(updated);
    expect(update).toHaveBeenCalledWith({ body: message.parsed, event: 'push', deliveryId: 'delivery-1', log });
    expect(updated ? log.info : log.error).toHaveBeenCalledWith(updated ? '[Consumer] Repo updated successfully' : '[Consumer] Repo update failed');
  });

  it('uses default repository and router modules when omitted', async () => {
    await expect(consume({ message, log, GitHub })).resolves.toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Consumer] Repo not found:', 'foo');
  });

  it('passes an injected target loader to the default router', async () => {
    const targetLoader = { load: jest.fn() };
    const RepoWithTargets = { targetLoader, get: jest.fn().mockResolvedValue(null) };
    await expect(consume({ message, log, GitHub, Repo: RepoWithTargets })).resolves.toBe(false);
    expect(targetLoader.load).not.toHaveBeenCalled();
  });

  it('defaults an absent event to push', async () => {
    delete message.event;
    const update = jest.fn().mockResolvedValue(true);
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: { update }, name: 'foo' });

    await expect(consume({ message, log, Repo, GitHub, Router, Handlers })).resolves.toBe(true);
    expect(GitHub.validate).toHaveBeenCalledWith({ post: message.parsed, event: 'push', log });
  });

  it('uses the default logger when no logger is provided', async () => {
    GitHub.validate.mockReturnValue(false);

    await expect(consume({ message, GitHub, Router, Handlers })).resolves.toBe(false);
    expect(GitHub.validate).toHaveBeenCalledWith({ post: message.parsed, event: 'push', log: expect.anything() });
  });

  it('uses the default GitHub module when no GitHub module is provided', async () => {
    message.parsed = null;

    await expect(consume({ message, log, Repo, Router, Handlers })).resolves.toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Consumer] GitHub validation failed');
  });

  it('uses the default event handlers when no handlers module is provided', async () => {
    message.event = 'issues';
    Router.resolveEventTarget.mockResolvedValue({ ignored: false, repo: { update: jest.fn() }, name: 'foo' });

    await expect(consume({ message, log, Repo, GitHub, Router })).resolves.toBe(true);
  });
});
