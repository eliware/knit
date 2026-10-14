import { createHash } from "node:crypto";

const API_ROOT = "https://api.github.com/repos";
const RETRIES = 3;

function blobSha(content) {
  const body = Buffer.from(content);
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

export async function fetchGitHubContentsFile({
  repository,
  path,
  commit,
  token,
  fetchFn,
  required = true,
}) {
  const repositoryPath = repository.split("/").map(encodeURIComponent).join("/");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`${repositoryPath}/contents/${encodedPath}`, `${API_ROOT}/`);
  url.searchParams.set("ref", commit);
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const response = await fetchFn(url.toString(), {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (response.ok) {
      const file = await response.json();
      if (file.path !== path || file.type !== "file" || typeof file.content !== "string")
        throw new Error(`Invalid GitHub Contents response for ${path}`);
      const content = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8");
      if (file.sha !== blobSha(content))
        throw new Error(`GitHub Contents SHA mismatch for ${path}`);
      return content;
    }
    if (response.status === 404 && !required) return undefined;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === RETRIES)
      throw new Error(`GitHub Contents request failed for ${path}: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** (attempt - 1)));
  }
}
