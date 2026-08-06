process.env.NODE_ENV = 'test';
import { jest } from '@jest/globals';
import inquirer from 'inquirer';
import nodeFs from 'node:fs';
import * as wizard from '../src/wizard.mjs';

const mockFs = {
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
};
const mockPath = jest.fn((...args) => args.filter(arg => typeof arg === 'string').join('/'));

const answers = (...values) => jest.spyOn(inquirer, 'prompt').mockImplementation(async () => values.shift());

describe('wizard.mjs', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
  });

  it('runs the wizard with npm install/test, commands, and existing directory', async () => {
    answers(
      { repoName: 'owner/repo' }, { installPath: '/tmp' },
      { runNpm: true }, { runNpmTest: true },
      { user: 'root' }, { group: 'root' }, { notify: 'https://example.test' }
    );
    const log = { info: jest.fn(), error: jest.fn() };
    await wizard.runWizard({ log, getCommands: jest.fn().mockResolvedValueOnce(['pre']).mockResolvedValueOnce(['post']), fs: mockFs, path: mockPath });

    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '../repos/owner/repo.json',
      JSON.stringify({ pwd: '/tmp', pre: ['pre'], user: 'root', group: 'root', post: ['npm install --silent', 'npm test > .jest.result 2>&1', 'post'], notify: 'https://example.test' }, null, 2)
    );
    expect(log.info).toHaveBeenLastCalledWith('Repository configuration complete');
  });

  it('runs without npm and creates the owner directory', async () => {
    mockFs.existsSync.mockReturnValue(false);
    answers(
      { repoName: 'acme/app' }, { installPath: '/srv/app' },
      { runNpm: false },
      { user: 'deploy' }, { group: 'apps' }, { notify: '' }
    );
    const log = { info: jest.fn(), error: jest.fn() };
    await wizard.runWizard({ log, getCommands: jest.fn().mockResolvedValue([]), fs: mockFs, path: mockPath });

    expect(mockFs.mkdirSync).toHaveBeenCalledWith('../repos/acme', { recursive: true });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('/acme/app.json'), expect.any(String));
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Repository configuration saved to'));
    expect(log.info).toHaveBeenCalledWith('Reminder: Set the GitHub webhook!', expect.any(Object));
  });

  it('runs npm install without npm test', async () => {
    answers(
      { repoName: 'o/r' }, { installPath: 'x' }, { runNpm: true }, { runNpmTest: false },
      { user: 'u' }, { group: 'g' }, { notify: 'n' }
    );
    await wizard.runWizard({ log: { info: jest.fn(), error: jest.fn() }, getCommands: jest.fn().mockResolvedValue([]), fs: mockFs, path: mockPath });
    expect(mockFs.writeFileSync.mock.calls[0][1]).toContain('npm install --silent');
    expect(mockFs.writeFileSync.mock.calls[0][1]).not.toContain('npm test');
  });

  it('exposes validation rules for required inputs', async () => {
    const prompt = answers({ repoName: 'o/r' }, { installPath: 'x' }, { runNpm: false }, { user: 'u' }, { group: 'g' }, { notify: '' });
    await wizard.runWizard({ log: { info: jest.fn(), error: jest.fn() }, getCommands: jest.fn().mockResolvedValue([]), fs: mockFs, path: mockPath });
    const configs = prompt.mock.calls.map(call => call[0][0]);
    expect(configs[0].validate('bad')).toBe('Invalid repository name format. Use owner/repo.');
    expect(configs[0].validate('o/r')).toBe(true);
    expect(configs[1].validate('')).toBe('Install path cannot be empty.');
    expect(configs[1].validate('/tmp')).toBe(true);
  });

  it('uses default wizard dependencies', async () => {
    answers(
      { repoName: 'coverage/defaults' }, { installPath: '/tmp' },
      { hasCommand: false }, { runNpm: false }, { hasCommand: false },
      { user: 'root' }, { group: 'root' }, { notify: '' }
    );
    await wizard.runWizard();

    expect(nodeFs).toBeDefined();
    nodeFs.rmSync(new URL('../repos/coverage', import.meta.url), { recursive: true, force: true });
  });

  it('uses default save configuration dependencies', async () => {
    const tempPath = jest.fn((...args) => args.length > 2
      ? '/tmp/knit-wizard-test/owner'
      : `/tmp/knit-wizard-test/${args[1]}`);
    const filePath = await wizard.saveConfigurationFile('owner', 'repo', '{}', undefined, tempPath);
    expect(filePath).toContain('/tmp/knit-wizard-test');
    nodeFs.rmSync('/tmp/knit-wizard-test', { recursive: true, force: true });
  });

  it('uses the default path resolver when saving a configuration', async () => {
    const fs = { existsSync: jest.fn(() => true), mkdirSync: jest.fn(), writeFileSync: jest.fn() };
    const filePath = await wizard.saveConfigurationFile('owner', 'repo', '{}', fs);
    expect(filePath).toContain('/repos/owner/repo.json');
    expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, '{}');
  });

  it('saves encrypted configuration with restricted permissions', async () => {
    const fs = { existsSync: jest.fn(() => true), mkdirSync: jest.fn(), writeFileSync: jest.fn() };
    const crypto = { isEncryptionConfigured: jest.fn(() => true), encrypt: jest.fn().mockResolvedValue('encrypted') };
    const filePath = await wizard.saveConfigurationFile('owner', 'repo', '{}', fs, mockPath, crypto);

    expect(filePath).toBe('../repos/owner/repo.json.age');
    expect(crypto.encrypt).toHaveBeenCalledWith('{}');
    expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, 'encrypted', { mode: 0o600 });
  });

  it('handles errors in the wizard', async () => {
    jest.spyOn(inquirer, 'prompt').mockRejectedValue(new Error('fail'));
    const log = { info: jest.fn(), error: jest.fn() };
    await wizard.runWizard({ log, fs: mockFs, path: mockPath });
    expect(log.error).toHaveBeenCalledWith('Wizard error:', expect.any(Error));
  });

  it('collects commands until user stops', async () => {
    const prompt = answers({ hasCommand: true }, { cmd: 'build' }, { more: false });
    await expect(wizard.getCommands('pre-deployment')).resolves.toEqual(['build']);
    const commandConfig = prompt.mock.calls[1][0][0];
    expect(commandConfig.validate('')).toBe('Command cannot be empty.');
    expect(commandConfig.validate('build')).toBe(true);
  });

  it('returns no commands when none configured', async () => {
    answers({ hasCommand: false });
    await expect(wizard.getCommands('post-deployment')).resolves.toEqual([]);
  });
});
