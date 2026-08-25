import { createHash } from 'node:crypto';
import { jest } from '@jest/globals';
import { loadWorkflow } from '../src/workflowLoader.mjs';

const commit = 'a'.repeat(40);
const files = {
  '.knit/deploy.yaml': 'version: 1\non:\n  push:\n    deployments: []\n  tags:\n    "v*":\n      deployments: []',
  'package.json': '{"description":"app","keywords":["test"]}',
};
const response = path => {
  const content = files[path];
  const body = Buffer.from(content);
  return { ok: true, status: 200, json: async () => ({ path, type: 'file', content: body.toString('base64'), sha: createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex') }) };
};

test('fetches only pinned workflow and package metadata', async () => {
  const fetchFn = jest.fn(url => response(new URL(url).pathname.endsWith('package.json') ? 'package.json' : '.knit/deploy.yaml'));
  await expect(loadWorkflow({ repository: 'eliware/app', commit, token: 'token', fetchFn })).resolves.toMatchObject({ commit, packageJson: { description: 'app' } });
  expect(fetchFn).toHaveBeenCalledTimes(2);
  expect(fetchFn.mock.calls[0][0]).toContain(`ref=${commit}`);
  expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
});

test.each([[{ repository: 'bad', commit }, 'Invalid repository'], [{ repository: 'eliware/app', commit: 'bad' }, 'Webhook commit SHA is required'], [{ repository: 'eliware/app' }, 'Webhook commit SHA is required']])('rejects invalid input', async (options, message) => {
  await expect(loadWorkflow(options)).rejects.toThrow(message);
});

test('allows package.json to be absent', async () => {
  const fetchFn = jest.fn(url => new URL(url).pathname.endsWith('package.json') ? { ok: false, status: 404 } : response('.knit/deploy.yaml'));
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn })).resolves.toMatchObject({ packageJson: undefined });
});

test('retries transient GitHub failures and rejects bad workflow responses', async () => {
  const fetchFn = jest.fn().mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce(response('.knit/deploy.yaml')).mockResolvedValueOnce(response('package.json'));
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn })).resolves.toBeDefined();
  const bad = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ path: 'wrong', type: 'file', content: '' }) });
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn: bad })).rejects.toThrow('Invalid GitHub Contents response');
});

test('rejects unavailable fetch, non-transient errors, SHA mismatches, and invalid package metadata', async () => {
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn: null })).rejects.toThrow('Fetch is unavailable');
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn: jest.fn().mockResolvedValue({ ok: false, status: 403 }) })).rejects.toThrow('HTTP 403');
  const mismatch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ path: '.knit/deploy.yaml', type: 'file', content: Buffer.from(files['.knit/deploy.yaml']).toString('base64'), sha: 'bad' }) });
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn: mismatch })).rejects.toThrow('SHA mismatch');
  const invalidContent = '{bad';
  const invalidBody = Buffer.from(invalidContent);
  const invalidSha = createHash('sha1').update(`blob ${invalidBody.length}\0`).update(invalidBody).digest('hex');
  const invalidPackage = jest.fn(url => url.includes('package.json') ? { ok: true, status: 200, json: async () => ({ path: 'package.json', type: 'file', content: invalidBody.toString('base64'), sha: invalidSha }) } : response('.knit/deploy.yaml'));
  await expect(loadWorkflow({ repository: 'eliware/app', commit, fetchFn: invalidPackage })).rejects.toThrow('Invalid package.json');
});
