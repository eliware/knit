import * as Repo from './repo.mjs';
import { defaultTargetLoader } from './targetLoader.mjs';

export function repositoryName(post) {
  return post?.repository?.full_name || null;
}

export async function resolveEventTarget({ post, event = 'push', RepoMod = Repo, targetLoader = defaultTargetLoader, log = console } = {}) {
  const name = repositoryName(post);
  if (name) {
    const repo = await RepoMod.get({ name, body: post, event, targetLoader, log });
    return repo ? { kind: 'repository', name, repo, ignored: false } : { kind: 'repository', name, repo: null, ignored: true };
  }
  return { kind: 'organization', name: null, repo: null, ignored: true };
}
