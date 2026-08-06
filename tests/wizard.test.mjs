process.env.NODE_ENV = 'test';
import { jest } from '@jest/globals';
import inquirer from 'inquirer';
import * as wizard from '../src/wizard.mjs';

const fsMock = { existsSync: jest.fn(() => true), mkdirSync: jest.fn(), writeFileSync: jest.fn() };
const pathMock = jest.fn((...args) => args.filter(arg => typeof arg === 'string').join('/'));
const answers = (...values) => jest.spyOn(inquirer, 'prompt').mockImplementation(async () => values.shift());

describe('wizard', () => {
  beforeEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); fsMock.existsSync.mockReturnValue(true); });

  it('generates the new SSH target format and encrypts it', async () => {
    answers(
      { repoName: 'owner/repo' }, { targetHost: 'dev.purinton.us' }, { installPath: '/srv/repo' },
      { runNpm: true }, { runNpmTest: true }, { user: 'root' }, { notify: 'url' }
    );
    const crypto = { isEncryptionConfigured: jest.fn(() => true), encrypt: jest.fn(async value => `encrypted:${value}`) };
    await wizard.runWizard({ log: { info: jest.fn(), error: jest.fn() }, getCommands: jest.fn()
      .mockResolvedValueOnce(['pre-command']).mockResolvedValueOnce(['post-command']), fs: fsMock, path: pathMock, crypto });
    expect(fsMock.writeFileSync).toHaveBeenCalledWith('/root/.config/knit-configs/plaintext/owner/repo.json', expect.stringContaining('repository'), { mode: 0o600 });
    expect(fsMock.writeFileSync).toHaveBeenCalledWith('/opt/knit-configs/owner/repo.json.age', expect.stringContaining('encrypted:'), { mode: 0o600 });
    const payload = JSON.parse(fsMock.writeFileSync.mock.calls[0][1]);
    expect(payload.targets[0]).toMatchObject({ host: 'dev.purinton.us', workingDirectory: '/srv/repo', user: 'root', identity: 'host-installed' });
    expect(payload.targets[0].pre).toEqual(['git pull --ff-only', 'pre-command']);
    expect(payload.targets[0].post).toEqual(['npm install --silent', 'npm test > .jest.result 2>&1', 'post-command']);
  });

  it('requires encryption and writes the local plaintext plus encrypted repo copy', async () => {
    const crypto = { isEncryptionConfigured: jest.fn(() => true), encrypt: jest.fn().mockResolvedValue('encrypted') };
    const filePath = await wizard.saveConfigurationFile('owner', 'repo', '{}', fsMock, pathMock, crypto);
    expect(filePath).toBe('/opt/knit-configs/owner/repo.json.age');
    expect(fsMock.writeFileSync).toHaveBeenCalledWith('/root/.config/knit-configs/plaintext/owner/repo.json', '{}', { mode: 0o600 });
    expect(fsMock.writeFileSync).toHaveBeenCalledWith(filePath, 'encrypted', { mode: 0o600 });
  });

  it('rejects unencrypted wizard output', async () => {
    await expect(wizard.saveConfigurationFile('owner', 'repo', '{}', fsMock, pathMock, { isEncryptionConfigured: () => false })).rejects.toThrow('encryption is required');
  });

  it('validates repository, host, path, and command inputs', async () => {
    const prompt = answers({ repoName: 'o/r' }, { targetHost: 'dev' }, { installPath: '/tmp' }, { runNpm: false }, { user: 'root' }, { notify: '' });
    await wizard.runWizard({ log: { info: jest.fn(), error: jest.fn() }, getCommands: jest.fn().mockResolvedValue([]), fs: fsMock, path: pathMock });
    const configs = prompt.mock.calls.map(call => call[0][0]);
    expect(configs[0].validate('bad')).toBe('Invalid repository name format. Use owner/repo.');
    expect(configs[1].validate('')).toBe('Target host cannot be empty.');
    expect(configs[2].validate('')).toBe('Install path cannot be empty.');
  });

  it('collects commands and handles wizard errors', async () => {
    answers({ hasCommand: true }, { cmd: 'build' }, { more: false });
    await expect(wizard.getCommands('pre')).resolves.toEqual(['build']);
    jest.restoreAllMocks();
    jest.spyOn(inquirer, 'prompt').mockRejectedValue(new Error('fail'));
    const log = { info: jest.fn(), error: jest.fn() };
    await wizard.runWizard({ log });
    expect(log.error).toHaveBeenCalledWith('Wizard error:', expect.any(Error));
  });
});
