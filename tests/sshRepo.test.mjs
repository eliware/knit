import { jest } from '@jest/globals';
import { createSshRepo } from '../src/repo.mjs';
test('runs SSH targets in order with strict options and stops', async()=>{const calls=[]; const execFile=jest.fn((bin,args,opt,cb)=>{calls.push(args); cb(args.at(-1).includes('bad')?Object.assign(new Error('x'),{code:1}):null,'','err')}); const repo=createSshRepo({config:{notify:null,targets:[{host:'a',user:'u',workingDirectory:'/x',pre:['one'],post:['bad','later']}],execution:{stopOnError:true}},execFile}); expect(await repo.update({body:{commits:[]}})).toBe(false); expect(calls).toHaveLength(3); expect(calls[1]).toEqual(expect.arrayContaining(['-o','StrictHostKeyChecking=yes','-o','IdentitiesOnly=yes']));});

test('uses resolved SSH identity and known-host files, quoting remote paths, and notifies', async () => {
  const files = new Map([['/cfg/key', 'PRIVATE KEY']]);
  const fsModule = {
    readFileSync: jest.fn(path => files.get(path)),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
  const execFile = jest.fn((bin, args, options, callback) => callback(null, 'out', 'err'));
  const notify = jest.fn();
  const repo = createSshRepo({
    config: { notify: 'url', targets: [{ host: 'host', user: 'user', workingDirectory: "/tmp/a'b", identity: 'key', knownHosts: 'known', pre: [], post: [] }], git: { url: "https://example.test/a'b", ref: 'main' } },
    configPath: '/cfg', tmpdir: '/tmp', fsModule, execFile, sendNotification: notify,
  });
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(true);
  expect(fsModule.readFileSync).toHaveBeenCalledWith('/cfg/key');
  expect(fsModule.writeFileSync).toHaveBeenCalledWith(expect.stringMatching(/^\/tmp\/knit-key-/), 'PRIVATE KEY', { mode: 0o600 });
  expect(execFile.mock.calls[0][1]).toEqual(expect.arrayContaining(['-o', 'UserKnownHostsFile=/cfg/known', '-i', expect.stringMatching(/^\/tmp\/knit-key-/)]));
  expect(execFile.mock.calls[0][1].at(-1)).toContain("cd -- '/tmp/a'\"'\"'b'");
  expect(fsModule.unlinkSync).toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: false }));
});

test('supports host-installed references and legacy execFile argument', async () => {
  const execFile = jest.fn((bin, args, options, callback) => callback(null, '', ''));
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', identity: 'host-installed', knownHosts: 'host-installed' }] } }, execFile);
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(true);
  expect(execFile).toHaveBeenCalled();
  expect(execFile.mock.calls[0][1]).not.toEqual(expect.arrayContaining(['-i']));
});

test('handles SSH callback errors and synchronous setup errors', async () => {
  const callbackError = Object.assign(new Error('ssh'), { code: 7 });
  const execFile = jest.fn((bin, args, options, callback) => callback(callbackError, 'stdout', 'stderr'));
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x' }] }, execFile });
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(false);

  const fsModule = { readFileSync: jest.fn(() => { throw new Error('read'); }), unlinkSync: jest.fn() };
  const broken = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', identity: 'key' }] }, fsModule, execFile: jest.fn() });
  await expect(broken.update({ body: { commits: [] } })).resolves.toBe(false);
});

test('continues after target failure when stopOnError is disabled and handles invalid bodies/tags', async () => {
  const execFile = jest.fn((bin, args, options, callback) => callback(args.at(-1).includes('fail') ? Object.assign(new Error('x'), { code: 2 }) : null, '', 'bad'));
  const notify = jest.fn();
  const repo = createSshRepo({ config: { targets: [{ host: 'h', user: 'u', workingDirectory: '/x', pre: ['fail'] }, { host: 'h2', user: 'u', workingDirectory: '/y' }], execution: { stopOnError: false } }, execFile, sendNotification: notify });
  await expect(repo.update({ body: {} })).resolves.toBe(false);
  await expect(repo.update({ body: { ref: 'refs/tags/v1', commits: [] } })).resolves.toBe(true);
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ hasError: false }));
  await expect(repo.update({ body: { commits: [] } })).resolves.toBe(false);
  expect(execFile.mock.calls.length).toBeGreaterThan(1);
});

test('resolves SSH notification webhook from notifyKey', () => {
 const resolver = {resolve: jest.fn(() => 'https://discord.test/webhook')};
 const repo = createSshRepo({config: {notifyKey: 'eliware__example', targets: [{host: 'h', user: 'u', workingDirectory: '/x'}]}, secretResolver: resolver, execFile: jest.fn()});
 expect(repo.notify).toBe('https://discord.test/webhook');
 expect(resolver.resolve).toHaveBeenCalledWith('eliware__example');
});
