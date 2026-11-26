import { log as logger } from "@eliware/common";
import Repo from "./repositoryLoader.mjs";
import __knitModule0 from "./targetLoader.mjs";
const { defaultTargetLoader } = __knitModule0;
function repositoryName(post) {
  return post?.repository?.full_name || null;
}
async function resolveEventTarget({
  post,
  event = "push",
  RepoMod = Repo,
  targetLoader = defaultTargetLoader,
  log = logger,
} = {}) {
  const name = repositoryName(post);
  if (name) {
    const repo = await RepoMod.get({
      name,
      body: post,
      event,
      targetLoader,
      log,
    });
    return repo
      ? {
          kind: "repository",
          name,
          repo,
          ignored: false,
        }
      : {
          kind: "repository",
          name,
          repo: null,
          ignored: true,
        };
  }
  return {
    kind: "organization",
    name: null,
    repo: null,
    ignored: true,
  };
}
export default repositoryName;
Object.assign(repositoryName, {
  repositoryName,
  resolveEventTarget,
});
