import { jest } from '@jest/globals';
import { createEmbed, createHandler, registerSpecializedHandlers, specializedEvents } from '../src/specializedHandlers.mjs';
import { createRegistry } from '../src/eventHandlers.mjs';

describe('specializedHandlers', () => {
  test('creates useful release embed', () => {
    const embed = createEmbed({ event: 'release', post: { action: 'published', repository: { full_name: 'eliware/app', html_url: 'repo' }, sender: { login: 'alice' }, release: { name: 'v1.2.3', html_url: 'release' } } });
    expect(embed.title).toContain('release published');
    expect(embed.description).toContain('v1.2.3');
    expect(embed.url).toBe('release');
  });

  test('includes workflow conclusion and status', () => {
    const embed = createEmbed({ event: 'workflow_run', post: { action: 'completed', repository: { full_name: 'eliware/app' }, workflow_run: { name: 'CI', conclusion: 'success', status: 'completed' } } });
    expect(embed.description).toContain('Conclusion: **success**');
    expect(embed.description).toContain('Status: **completed**');
  });

  test('handler sends specialized embed', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const handler = createHandler({ event: 'issues', Notifier: { send } });
    await expect(handler({ post: { action: 'opened' }, target: { repo: { notify: 'url' } } })).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ notifyUrl: 'url', event: 'issues', embed: expect.any(Object) }));
  });

  test('handler supports default options and logger', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const handler = createHandler({ event: 'issues', Notifier: { send } });
    await expect(handler({ post: {}, target: { repo: { notify: 'url' } } })).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ log: expect.anything() }));
    await expect(createHandler()({ post: {}, target: {} })).resolves.toBe(true);
  });

  test('handler without target is a no-op success', async () => {
    const send = jest.fn();
    await expect(createHandler({ event: 'deployment', Notifier: { send } })({ post: {}, target: {} })).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  test('registers all specialized event types', () => {
    const registry = registerSpecializedHandlers(createRegistry());
    for (const event of specializedEvents) expect(registry.has(event)).toBe(true);
  });


  test('uses fallback repository, actor, and action values', () => {
    const embed = createEmbed({ event: 'unknown', post: {} });
    expect(embed.title).toBe('Unknown Repository: unknown updated');
    expect(embed.description).toBe('Actor: **unknown**');
    expect(embed.color).toBe(0x3498DB);
    expect(embed).not.toHaveProperty('url');
  });

  test.each([
    [{ sender: { name: 'sender-name' } }, 'sender-name'],
    [{ pusher: { name: 'pusher-name' } }, 'pusher-name'],
  ])('selects actor fallback from post data', (post, expected) => {
    expect(createEmbed({ event: 'issues', post }).description).toContain(`Actor: **${expected}**`);
  });

  test('uses repository url and all supported data name fields', () => {
    const fields = ['title', 'display_title', 'environment', 'ref'];
    for (const field of fields) {
      const post = { repository: { html_url: 'repository' }, issue: { [field]: field } };
      const embed = createEmbed({ event: 'pull_request', post });
      expect(embed.description).toContain(`**${field}**`);
      expect(embed.url).toBe('repository');
    }
  });

  test('uses data url when html_url is absent', () => {
    expect(createEmbed({ event: 'deployment', post: { deployment: { url: 'deployment' } } }).url).toBe('deployment');
  });

  test('includes state and status', () => {
    const embed = createEmbed({ event: 'deployment_status', post: { deployment_status: { state: 'active', status: 'in_progress' } } });
    expect(embed.description).toContain('State: **active**');
    expect(embed.description).toContain('Status: **in_progress**');
  });

  test('registers expected color for every specialized event', () => {
    const registry = { register: jest.fn() };
    registerSpecializedHandlers(registry, { Notifier: { send: jest.fn() } });
    expect(registry.register).toHaveBeenCalledTimes(specializedEvents.length);
    for (const event of specializedEvents) {
      expect(registry.register).toHaveBeenCalledWith(event, expect.any(Function));
    }
  });

  test('handler passes all notification fields and supplied logger', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const log = jest.fn();
    const post = { action: 'closed', repository: { full_name: 'org/repo' } };
    await createHandler({ event: 'issues', Notifier: { send } })({ post, target: { repo: { notify: 'url' } }, log });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ notifyUrl: 'url', post, log, logOutput: '', hasError: false }));
  });
});
