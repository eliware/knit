import { jest, test, expect } from '@jest/globals';
import path from 'node:path';
import { createSshRepo, get } from '../src/repo.mjs';

const target = overrides => ({ host: 'host', user: 'user', workingDirectory: '/opt/app', commands: ['one', 'two'], ...overrides });
const body = { commits: [] };

test('executes target commands through ssh-client and maps options', async () => {
  const sshExec = jest.fn().mockResolvedValue([{ command: 'one', result: 'out\n', code: 0 }, { command: 'two', result: '', code: 0 }]);
  const repo = createSshRepo({ config: { targets: [target({ identity: 'key', knownHosts: 'known', hostCa: 'ca' })] }, sshExec, configPath: '/cfg' });
  await expect(repo.update({ body })).resolves.toBe(true);
  expect(sshExec).toHaveBeenCalledWith(expect.objectContaining({ host: 'host', username: 'user', cwd: '/opt/app', commands: ['one', 'two'], privateKeyPath: path.join('/cfg', 'key'), knownHostsPath: path.join('/cfg', 'known'), hostCaPath: path.join('/cfg', 'ca') }));
});

test('stops on command failure and reports output', async () => {
  const notify = jest.fn(); const log = { error: jest.fn(), info: jest.fn() };
  const sshExec = jest.fn().mockResolvedValue([{ command: 'bad', result: 'failed', code: 2 }, { command: 'later', result: '', code: 0 }]);
  const repo = createSshRepo({ config: { targets: [target({ commands: ['bad', 'later'] })] }, sshExec, sendNotification: notify });
  await expect(repo.update({ body, log })).resolves.toBe(false);
  expect(log.error).toHaveBeenCalled(); expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: true, logOutput: expect.stringContaining('Exit Code: 2') }));
});

test('continues to later targets when stopOnError is disabled', async () => {
  const sshExec = jest.fn().mockResolvedValueOnce([{ command: 'fail', result: '', code: 1 }]).mockResolvedValueOnce([{ command: 'ok', result: 'done', code: 0 }]);
  const repo = createSshRepo({ config: { targets: [target({ commands: ['fail'] }), target({ host: 'host2', commands: ['ok'] })], execution: { stopOnError: false } }, sshExec });
  await expect(repo.update({ body })).resolves.toBe(false); expect(sshExec).toHaveBeenCalledTimes(2);
});

test('handles connection errors, invalid bodies, tags, and host-installed paths', async () => {
  const notify = jest.fn(); const sshExec = jest.fn().mockRejectedValueOnce(Object.assign(new Error('offline'), { code: 'SSH_CONNECTION', stdout: 'o', stderr: 'e' }));
  const repo = createSshRepo({ config: { targets: [target({ identity: 'host-installed', knownHosts: 'host-installed' })] }, sshExec, sendNotification: notify });
  await expect(repo.update({ body })).resolves.toBe(false); expect(sshExec).toHaveBeenCalledWith(expect.objectContaining({ privateKeyPath: undefined, knownHostsPath: undefined }));
  await expect(repo.update({ body: {} })).resolves.toBe(false);
  await expect(repo.update({ body: { ref: 'refs/tags/v1', commits: [] } })).resolves.toBe(true);
});

test('supports absolute CA paths and errors without an exit code', async () => {
  const sshExec = jest.fn().mockRejectedValue(new Error('offline'));
  const repo = createSshRepo({ config: { discordChannelId: '123456789012345678', targets: [target({ identity: '/key', knownHosts: '/known', hostCa: '/ca' })] }, sshExec, sendNotification: jest.fn() });
  await expect(repo.update({ body })).resolves.toBe(false);
  expect(sshExec).toHaveBeenCalledWith(expect.objectContaining({ privateKeyPath: '/key', knownHostsPath: '/known', hostCaPath: '/ca' }));
});

test('exposes configured Discord channel ID', () => {
  const repo = createSshRepo({ config: { discordChannelId: '123456789012345678', targets: [target()] }, sshExec: jest.fn() });
  expect(repo.discordChannelId).toBe('123456789012345678');
});

test('builds the default Discord notifier for configured channels', () => {
  expect(createSshRepo({ config: { discordChannelId: '123456789012345678', targets: [target()] }, sshExec: jest.fn() }).discordChannelId).toBe('123456789012345678');
});

test('invokes the default Discord notifier when a channel is configured', async () => {
  const repo = createSshRepo({ config: { discordChannelId: '123456789012345678', targets: [target()] }, sshExec: jest.fn() });
  await expect(repo.update({ body: { ref: 'refs/tags/v1', commits: [] } })).rejects.toThrow('Discord client is not connected');
});

test('loads validated repositories', async () => {
  const config = { repository: 'owner/repo', targets: [target()], execution: { mode: 'sequential', stopOnError: true } };
  const loader = { load: jest.fn().mockResolvedValue(config) };
  await expect(get({ name: 'owner/repo', loader })).resolves.toEqual(expect.objectContaining({ targets: config.targets }));
  await expect(get({ name: 'owner/repo', loaderOptions: { load: jest.fn().mockResolvedValue(config) } })).resolves.toEqual(expect.objectContaining({ targets: config.targets }));
  await expect(get({ name: 'missing', loader: { load: jest.fn().mockResolvedValue(null) } })).resolves.toBeNull();
});

test('uses default loader configuration when no loader is supplied', async () => {
  await expect(get({ name: 'missing-repository' })).resolves.toBeNull();
});
