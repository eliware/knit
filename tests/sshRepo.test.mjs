import { jest } from '@jest/globals';
import path from 'node:path';
import { createSshRepo } from '../src/repo.mjs';
test('runs configured SSH commands in order with strict options and stops', async()=>{const calls=[]; const execFile=jest.fn((bin,args,opt,cb)=>{calls.push(args); cb(args.at(-1).includes('bad')?Object.assign(new Error('x'),{code:1}):null,'','err')}); const repo=createSshRepo({config:{notify:null,targets:[{host:'a',user:'u',workingDirectory:'/x',commands:['one','bad','later']}],execution:{stopOnError:true}},execFile}); expect(await repo.update({body:{commits:[]}})).toBe(false); expect(calls).toHaveLength(2); expect(calls[0].at(-1)).toContain('one 2>&1'); expect(calls[1]).toEqual(expect.arrayContaining(['-o','StrictHostKeyChecking=yes','-o','IdentitiesOnly=yes']));});

test('executes an explicit target command list without implicit Git commands', async () => {
  const commands = [];
  const execFile = jest.fn((bin, args, options, callback) => { commands.push(args.at(-1)); callback(null, '', ''); });
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/opt/app', commands: ['git pull --ff-only', 'npm install', 'npm test'] }], git: { url: 'ignored', ref: 'main' } }, execFile });
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(true);
  expect(commands.map(command => command.split(' && ').at(-1))).toEqual(['git pull --ff-only 2>&1', 'npm install 2>&1', 'npm test 2>&1']);
  expect(commands.join('\n')).not.toContain('FETCH_HEAD');
});

test('uses resolved SSH identity and known-host files, quoting remote paths, and notifies', async () => {
  const files = new Map([['/cfg/key', 'PRIVATE KEY']]);
  const fsModule = {
    readFileSync: jest.fn(file => files.get(file.replaceAll(/\\/g, '/').replace(/^[A-Za-z]:/, ''))),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
  const execFile = jest.fn((bin, args, options, callback) => callback(null, 'out', 'err'));
  const notify = jest.fn();
  const repo = createSshRepo({
    config: { discordChannelId: '123456789012345678', targets: [{ host: 'host', user: 'user', workingDirectory: "/tmp/a'b", identity: 'key', knownHosts: 'known', commands: ['echo ok'] }] },
    configPath: '/cfg', tmpdir: '/tmp', fsModule, execFile, sendNotification: notify,
  });
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(true);
  expect(fsModule.readFileSync).toHaveBeenCalledWith(path.join('/cfg', 'key'));
  expect(fsModule.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('knit-key-'), 'PRIVATE KEY', { mode: 0o600 });
  expect(execFile.mock.calls[0][1]).toEqual(expect.arrayContaining(['-o', `UserKnownHostsFile=${path.join('/cfg', 'known')}`, '-i', expect.stringContaining('knit-key-')]));
  expect(execFile.mock.calls[0][1].at(-1)).toContain("cd -- '/tmp/a'\"'\"'b'");
  expect(fsModule.unlinkSync).toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: false }));
});

test('preserves absolute SSH reference paths', async () => {
  const fsModule = { readFileSync: jest.fn(() => 'PRIVATE KEY'), writeFileSync: jest.fn(), unlinkSync: jest.fn() };
  const execFile = jest.fn((bin, args, options, callback) => callback(null, '', ''));
  const repo = createSshRepo({
    config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', identity: '/run/secrets/id_rsa', knownHosts: '/run/secrets/known_hosts', commands: ['echo ok'] }] },
    configPath: '/etc/knit/config', tmpdir: '/tmp', fsModule, execFile,
  });
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(true);
  expect(fsModule.readFileSync).toHaveBeenCalledWith('/run/secrets/id_rsa');
  expect(execFile.mock.calls[0][1]).toEqual(expect.arrayContaining(['-o', 'UserKnownHostsFile=/run/secrets/known_hosts']));
});

test('supports host-installed references and legacy execFile argument', async () => {
  const execFile = jest.fn((bin, args, options, callback) => callback(null, '', ''));
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', identity: 'host-installed', knownHosts: 'host-installed', commands: ['echo ok'] }] } }, execFile);
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(true);
  expect(execFile).toHaveBeenCalled();
  expect(execFile.mock.calls[0][1]).not.toEqual(expect.arrayContaining(['-i']));
});

test('handles SSH callback errors and synchronous setup errors', async () => {
  const callbackError = Object.assign(new Error('ssh'), { code: 7 });
  const execFile = jest.fn((bin, args, options, callback) => callback(callbackError, 'stdout', 'stderr'));
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', commands: ['echo ok'] }] }, execFile });
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(false);

  const fsModule = { readFileSync: jest.fn(() => { throw new Error('read'); }), unlinkSync: jest.fn() };
  const broken = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', identity: 'key', commands: ['echo ok'] }] }, fsModule, execFile: jest.fn() });
  await expect(broken.update({ body: { commits: [] } })).resolves.toBe(false);
});

test('continues after target failure when stopOnError is disabled and handles invalid bodies/tags', async () => {
  const execFile = jest.fn((bin, args, options, callback) => callback(args.at(-1).includes('fail') ? Object.assign(new Error('x'), { code: 2 }) : null, '', 'bad'));
  const notify = jest.fn();
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', commands: ['fail'] }, { host: 'h2', user: 'u', workingDirectory: '/y', commands: ['echo ok'] }], execution: { stopOnError: false } }, execFile, sendNotification: notify });
  await expect(repo.update({ body: {} })).resolves.toBe(false);
  await expect(repo.update({ body: { ref: 'refs/tags/v1', commits: [] } })).resolves.toBe(true);
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: false }));
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(false);
  expect(execFile.mock.calls.length).toBeGreaterThan(1);
});

test('exposes configured Discord channel ID', () => {
 const repo = createSshRepo({config: {discordChannelId: '123456789012345678', targets: [{host: 'h', user: 'u', workingDirectory: '/x', commands: ['echo ok']}]}, execFile: jest.fn()});
 expect(repo.discordChannelId).toBe('123456789012345678');
});
