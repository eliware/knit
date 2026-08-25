import { createHash } from 'node:crypto';
import * as yaml from 'js-yaml';

const API_ROOT = 'https://api.github.com/repos';
const RETRIES = 3;

function blobSha(content) {
  const body = Buffer.from(content);
  return createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex');
}

async function fetchFile({ repository, path, commit, token, fetchFn, required }) {
  const url = `${API_ROOT}/${repository}/contents/${path}?ref=${commit}`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const response = await fetchFn(url, { headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    if (response.ok) {
      const file = await response.json();
      if (file.path !== path || file.type !== 'file' || typeof file.content !== 'string') throw new Error(`Invalid GitHub Contents response for ${path}`);
      const content = Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8');
      if (file.sha !== blobSha(content)) throw new Error(`GitHub Contents SHA mismatch for ${path}`);
      return content;
    }
    if (response.status === 404 && !required) return undefined;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === RETRIES) throw new Error(`GitHub Contents request failed for ${path}: HTTP ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 100 * 2 ** (attempt - 1)));
  }
}

export async function loadWorkflow({ repository, commit, token = process.env.GITHUB_READ_TOKEN, fetchFn = globalThis.fetch } = {}) {
  if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) throw new Error('Invalid repository');
  if (!/^[0-9a-f]{40}$/.test(commit || '')) throw new Error('Webhook commit SHA is required');
  if (typeof fetchFn !== 'function') throw new Error('Fetch is unavailable');
  const source = await fetchFile({ repository, path: '.knit/deploy.yaml', commit, token, fetchFn, required: true });
  const packageSource = await fetchFile({ repository, path: 'package.json', commit, token, fetchFn, required: false });
  let packageJson;
  if (packageSource) {
    try { packageJson = JSON.parse(packageSource); } catch { throw new Error('Invalid package.json'); }
  }
  return { workflow: yaml.load(source), packageJson, commit };
}
