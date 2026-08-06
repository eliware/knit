import * as Repo from './repo.mjs';

const FALLBACK_REPOSITORY = 'eliware/knit';

export function repositoryName(post) {
  return post?.repository?.full_name || null;
}

export async function resolveEventTarget({ post, RepoMod = Repo, log = console } = {}) {
  const name = repositoryName(post);
  if (name) {
    const repo = await RepoMod.get({ name, log });
    return repo ? { kind: 'repository', name, repo, ignored: false } : { kind: 'repository', name, repo: null, ignored: true };
  }
  const repo = await RepoMod.get({ name: FALLBACK_REPOSITORY, log });
  return { kind: 'organization', name: FALLBACK_REPOSITORY, repo, ignored: !repo };
}

export { FALLBACK_REPOSITORY };
