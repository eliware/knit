import { jest } from '@jest/globals';
import { createSshRepo, get } from '../src/repo.mjs';

const deployment = overrides => ({ target: 'dev', cwd: '/opt/app', commands: ['one', 'two'], ...overrides });
const target = { host: 'host', user: 'user', identity: '/key', knownHosts: '/known', hostCa: '/ca' };
const body = { commits: [{ id: 'commit' }] };

test('executes repository workflow against the named trusted target', async () => {
  const sshExec = jest.fn().mockResolvedValue([{ command: 'one', result: 'out\n', code: 0 }, { command: 'two', result: '', code: 0 }]);
  const repo = createSshRepo({ config: { deployments: [deployment()] }, targets: { dev: target }, sshExec });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenCalledWith(expect.objectContaining({ host: 'host', username: 'user', cwd: '/opt/app', commands: ['one', 'two'], privateKeyPath: '/key', knownHostsPath: '/known', hostCaPath: '/ca' }));
});

test('passes webhook metadata as SSH environment without interpolating commands', async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({ config: { deployments: [deployment({ timeoutMs: 300000 })] }, targets: { dev: target }, sshExec });
  await repo.update({ body: { ...body, after: 'a'.repeat(40), ref: 'refs/heads/main', repository: { full_name: 'eliware/app' } }, event: 'push', deliveryId: 'delivery-1' });
  expect(sshExec).toHaveBeenCalledWith(expect.objectContaining({ commandTimeout: 300000, env: { KNIT_COMMIT_SHA: 'a'.repeat(40), KNIT_REPOSITORY: 'eliware/app', KNIT_REF: 'refs/heads/main', KNIT_EVENT: 'push', KNIT_DELIVERY_ID: 'delivery-1' } }));
});

test('uses deterministic empty metadata for absent optional event fields', async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({ config: { deployments: [deployment()] }, targets: { dev: target }, sshExec });
  await repo.update({ body, event: null, deliveryId: null });
  expect(sshExec.mock.calls[0][0].env).toEqual({ KNIT_COMMIT_SHA: '', KNIT_REPOSITORY: '', KNIT_REF: '', KNIT_EVENT: '', KNIT_DELIVERY_ID: '' });
});

test('does not pass malformed commit metadata to remote commands', async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({ config: { deployments: [deployment()] }, targets: { dev: target }, sshExec });
  await repo.update({ body: { ...body, after: 'not-a-sha' } });
  expect(sshExec.mock.calls[0][0].env.KNIT_COMMIT_SHA).toBe('');
});

test('uses different command sets and directories per target', async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({ config: { deployments: [deployment(), deployment({ target: 'nas', cwd: '/srv/app', commands: ['deploy'] })] }, targets: { dev: target, nas: { ...target, host: 'nas' } }, sshExec });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenNthCalledWith(2, expect.objectContaining({ host: 'nas', cwd: '/srv/app', commands: ['deploy'] }));
});

test('reports command failures and stops by default', async () => {
  const sshExec = jest.fn().mockResolvedValue([{ command: 'one', result: 'failed', code: 2 }]);
  const notify = jest.fn();
  const repo = createSshRepo({ config: { deployments: [deployment(), deployment({ target: 'nas' })] }, targets: { dev: target, nas: target }, sshExec, sendNotification: notify });
  await expect(repo.update({ body })).resolves.toBe(false);
  expect(sshExec).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: true }));
});

test('rejects unknown targets before execution', async () => {
  const sshExec = jest.fn();
  const repo = createSshRepo({ config: { deployments: [deployment({ target: 'unknown' })] }, targets: { dev: target }, sshExec });
  await expect(repo.update({ body })).rejects.toThrow('Unknown deployment target');
  expect(sshExec).not.toHaveBeenCalled();
});

test('rejects cwd outside the trusted target root', async () => {
  const sshExec = jest.fn();
  const repo = createSshRepo({ config: { deployments: [deployment({ cwd: '/srv/app' })] }, targets: { dev: { ...target, allowedCwdRoot: '/opt' } }, sshExec });
  await expect(repo.update({ body })).rejects.toThrow('outside target root');
  expect(sshExec).not.toHaveBeenCalled();
});

test('allows any absolute cwd when the trusted target root is filesystem root', async () => {
  const sshExec = jest.fn().mockResolvedValue([]);
  const repo = createSshRepo({ config: { deployments: [deployment({ cwd: '/opt/knit' })] }, targets: { dev: { ...target, allowedCwdRoot: '/' } }, sshExec });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenCalled();
});

test('handles invalid bodies, tags, connection errors, and continue-on-error', async () => {
  const sshExec = jest.fn()
    .mockRejectedValueOnce(Object.assign(new Error('offline'), { stdout: 'out', stderr: 'err' }))
    .mockResolvedValueOnce([{ command: 'deploy', result: '', code: 1 }])
    .mockResolvedValueOnce([{ command: 'later', result: 'ok', code: 0 }]);
  const notify = jest.fn();
  const repo = createSshRepo({ config: { stopOnError: false, deployments: [deployment({ commands: ['first'] }), deployment({ target: 'nas', commands: ['second'] }), deployment({ target: 'nas', commands: ['third'] })] }, targets: { dev: target, nas: target }, sshExec, sendNotification: notify });
  await expect(repo.update({ body: {} })).resolves.toBe(false);
  await expect(repo.update({ body: { ref: 'refs/tags/v1', commits: [] } })).resolves.toBe(true);
  await expect(repo.update({ body })).resolves.toBe(false);
  expect(sshExec).toHaveBeenCalledTimes(3);
  expect(notify).toHaveBeenCalled();
});

test('uses the shared notifier for tag notifications', async () => {
  const repo = createSshRepo({ config: { deployments: [] }, targets: {} });
  const notifier = await import('../src/notifier/index.mjs');
  const client = { channels: { fetch: jest.fn().mockResolvedValue({ send: jest.fn().mockResolvedValue(undefined) }) } };
  notifier.setDiscordClient(client);
  notifier.setChannelResolver(jest.fn().mockResolvedValue('channel'));
  await expect(repo.update({ body: { ref: 'refs/tags/v1', commits: [], repository: { full_name: 'o/r' } } })).resolves.toBe(true);
  notifier.clearDiscordClient();
});

test('loads, validates, and authorizes a repository workflow', async () => {
  const targetLoader = { load: jest.fn().mockReturnValue({ targets: { dev: target } }) };
  const workflowLoader = jest.fn().mockResolvedValue({ workflow: { version: 1, on: { push: { deployments: [deployment()] }, tags: { 'v*': { deployments: [deployment()] } } } } });
  await expect(get({ name: 'eliware/app', body: { after: 'a'.repeat(40) }, targetLoader, workflowLoader })).resolves.toBeDefined();
  expect(workflowLoader).toHaveBeenCalledWith({ repository: 'eliware/app', commit: 'a'.repeat(40) });
});

test('rejects malformed and unknown-target workflows', async () => {
  const targetLoader = { load: () => ({ targets: { dev: target } }) };
  await expect(get({ name: 'eliware/app', body: { after: 'a'.repeat(40) }, targetLoader, workflowLoader: async () => ({ workflow: { version: 1, on: { push: { deployments: [] }, tags: { 'v*': { deployments: [deployment()] } } } } }) })).resolves.toBeNull();
  await expect(get({ name: 'eliware/app', body: { after: 'a'.repeat(40) }, targetLoader, workflowLoader: async () => ({ workflow: { version: 1, on: { push: { deployments: [deployment({ target: 'missing' })] }, tags: { 'v*': { deployments: [deployment()] } } } } }) })).resolves.toBeNull();
});

test('supports the default notification path when no notifier is supplied', async () => {
  const repo = createSshRepo({ config: { deployments: [] }, targets: {} });
  await expect(repo.update({ body })).resolves.toBe(true);
});

test('rejects unauthorized repository workflows', async () => {
  const targetLoader = { load: () => ({ targets: { nas: { ...target, allowedRepositories: ['eliware/other'] } } }) };
  const workflowLoader = async () => ({ workflow: { version: 1, on: { push: { deployments: [deployment({ target: 'nas' })] }, tags: { 'v*': { deployments: [deployment()] } } } } });
  await expect(get({ name: 'eliware/app', body: { after: 'a'.repeat(40) }, targetLoader, workflowLoader })).resolves.toBeNull();
});

test('returns a notification-only repository for non-push events and ignores unmatched tags', async () => {
  const targetLoader = { load: () => ({ targets: {} }) };
  await expect(get({ name: 'eliware/app', event: 'issues', body: {}, targetLoader })).resolves.toBeDefined();
  await expect(get({ name: 'eliware/app', event: 'issues', body: {}, targetLoader: { load: () => ({}) } })).resolves.toBeDefined();
  const workflow = { version: 1, on: { push: { deployments: [deployment()] }, tags: { 'v*': { deployments: [deployment()] } } } };
  await expect(get({ name: 'eliware/app', body: { after: 'a'.repeat(40), ref: 'refs/tags/beta' }, targetLoader: { load: () => ({ targets: { dev: target } }) }, workflowLoader: async () => ({ workflow }) })).resolves.toBeNull();
});
