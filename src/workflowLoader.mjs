import * as yaml from "js-yaml";
import { fetchGitHubContentsFile } from "./githubContentsFile.mjs";

export async function loadWorkflow({
  repository,
  commit,
  token = process.env.GITHUB_READ_TOKEN,
  fetchFn = globalThis.fetch,
} = {}) {
  if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) throw new Error("Invalid repository");
  if (!/^[0-9a-f]{40}$/.test(commit || "")) throw new Error("Webhook commit SHA is required");
  if (typeof fetchFn !== "function") throw new Error("Fetch is unavailable");
  const source = await fetchGitHubContentsFile({
    repository,
    path: ".knit/deploy.yaml",
    commit,
    token,
    fetchFn,
    required: true,
  });
  const packageSource = await fetchGitHubContentsFile({
    repository,
    path: "package.json",
    commit,
    token,
    fetchFn,
    required: false,
  });
  let packageJson;
  if (packageSource) {
    try {
      packageJson = JSON.parse(packageSource);
    } catch {
      throw new Error("Invalid package.json");
    }
  }
  return { workflow: yaml.load(source), packageJson, commit };
}
