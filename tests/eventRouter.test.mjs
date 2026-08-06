import { jest } from '@jest/globals';
import { FALLBACK_REPOSITORY, repositoryName, resolveEventTarget } from '../src/eventRouter.mjs';

describe('eventRouter', () => {
  test('extracts repository names', () => {
    expect(repositoryName({ repository: { full_name: 'eliware/knit' } })).toBe('eliware/knit');
    expect(repositoryName({})).toBeNull();
  });

  test('routes repository events to their configured repository', async () => {
    const repo = { notify: 'configured' };
    const Repo = { get: jest.fn().mockResolvedValue(repo) };
    await expect(resolveEventTarget({ post: { repository: { full_name: 'eliware/knit' } }, RepoMod: Repo })).resolves.toEqual({ kind: 'repository', name: 'eliware/knit', repo, ignored: false });
  });

  test('marks unknown repositories ignored', async () => {
    const Repo = { get: jest.fn().mockResolvedValue(null) };
    await expect(resolveEventTarget({ post: { repository: { full_name: 'unknown/repo' } }, RepoMod: Repo })).resolves.toEqual({ kind: 'repository', name: 'unknown/repo', repo: null, ignored: true });
  });

  test('routes organization events to the Knit fallback', async () => {
    const repo = { notify: 'fallback' };
    const Repo = { get: jest.fn().mockResolvedValue(repo) };
    const target = await resolveEventTarget({ post: { organization: { login: 'eliware' } }, RepoMod: Repo });
    expect(target).toEqual({ kind: 'organization', name: FALLBACK_REPOSITORY, repo, ignored: false });
    expect(Repo.get).toHaveBeenCalledWith(expect.objectContaining({ name: FALLBACK_REPOSITORY }));
  });
});
