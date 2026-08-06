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

  test('handler without target is a no-op success', async () => {
    const send = jest.fn();
    await expect(createHandler({ event: 'deployment', Notifier: { send } })({ post: {}, target: {} })).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  test('registers all specialized event types', () => {
    const registry = registerSpecializedHandlers(createRegistry());
    for (const event of specializedEvents) expect(registry.has(event)).toBe(true);
  });
});
