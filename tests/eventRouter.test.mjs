import { jest } from '@jest/globals';
jest.unstable_mockModule('../src/repo.mjs', () => ({ get: jest.fn() }));

const { FALLBACK_REPOSITORY, repositoryName, resolveEventTarget } = await import('../src/eventRouter.mjs');

describe('eventRouter', () => {
  test('extracts repository names and handles missing data', () => {
    expect(repositoryName({ repository: { full_name: 'eliware/knit' } })).toBe('eliware/knit');
    expect(repositoryName({ repository: {} })).toBeNull();
    expect(repositoryName({ repository: { full_name: '' } })).toBeNull();
    expect(repositoryName({})).toBeNull();
    expect(repositoryName()).toBeNull();
  });

  test('routes configured repository events', async () => {
    const repo = { notify: 'configured' };
    const RepoMod = { get: jest.fn().mockResolvedValue(repo) };
    const log = { info: jest.fn() };
    const post = { repository: { full_name: 'eliware/knit' } };

    await expect(resolveEventTarget({ post, RepoMod, log })).resolves.toEqual({
      kind: 'repository', name: 'eliware/knit', repo, ignored: false,
    });
    expect(RepoMod.get).toHaveBeenCalledWith({ name: 'eliware/knit', log });
  });

  test('marks unknown repositories ignored', async () => {
    const RepoMod = { get: jest.fn().mockResolvedValue(null) };
    const post = { repository: { full_name: 'unknown/repo' } };

    await expect(resolveEventTarget({ post, RepoMod })).resolves.toEqual({
      kind: 'repository', name: 'unknown/repo', repo: null, ignored: true,
    });
  });

  test.each([undefined, {}, { repository: {} }])('routes %j to fallback', async (post) => {
    const repo = { notify: 'fallback' };
    const RepoMod = { get: jest.fn().mockResolvedValue(repo) };

    await expect(resolveEventTarget({ post, RepoMod })).resolves.toEqual({
      kind: 'organization', name: FALLBACK_REPOSITORY, repo, ignored: false,
    });
    expect(RepoMod.get).toHaveBeenCalledWith({ name: FALLBACK_REPOSITORY, log: console });
  });

  test('ignores fallback when Knit is not configured', async () => {
    const RepoMod = { get: jest.fn().mockResolvedValue(null) };

    await expect(resolveEventTarget({ post: {}, RepoMod })).resolves.toEqual({
      kind: 'organization', name: FALLBACK_REPOSITORY, repo: null, ignored: true,
    });
  });

  test('uses default options when called without arguments', async () => {
    await expect(resolveEventTarget()).resolves.toEqual({
      kind: 'organization', name: FALLBACK_REPOSITORY, repo: null, ignored: true,
    });
  });

  test('uses default options with an injected fallback repository', async () => {
    const repo = { notify: 'fallback' };
    await expect(resolveEventTarget({ RepoMod: { get: jest.fn().mockResolvedValue(repo) } })).resolves.toEqual({
      kind: 'organization', name: FALLBACK_REPOSITORY, repo, ignored: false,
    });
  });

  test('exports the expected fallback repository', () => {
    expect(FALLBACK_REPOSITORY).toBe('eliware/knit');
  });
});
