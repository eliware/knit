import { jest } from '@jest/globals';
import { repositoryName, resolveEventTarget } from '../src/eventRouter.mjs';

describe('eventRouter', () => {
  test('extracts repository names', () => {
    expect(repositoryName({ repository: { full_name: 'eliware/knit' } })).toBe('eliware/knit');
    expect(repositoryName({ repository: {} })).toBeNull();
    expect(repositoryName()).toBeNull();
  });

  test('routes repository events with the webhook body', async () => {
    const repo = { update: jest.fn() };
    const RepoMod = { get: jest.fn().mockResolvedValue(repo) };
    const targetLoader = { load: jest.fn() };
    const post = { after: 'a'.repeat(40), repository: { full_name: 'eliware/knit' } };
    await expect(resolveEventTarget({ post, RepoMod, targetLoader })).resolves.toEqual({ kind: 'repository', name: 'eliware/knit', repo, ignored: false });
    expect(RepoMod.get).toHaveBeenCalledWith({ name: 'eliware/knit', body: post, event: 'push', targetLoader, log: console });
  });

  test('rejects events without a repository instead of using a fallback', async () => {
    await expect(resolveEventTarget({})).resolves.toEqual({ kind: 'organization', name: null, repo: null, ignored: true });
  });
});
