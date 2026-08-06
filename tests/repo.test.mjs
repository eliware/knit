import { jest } from '@jest/globals';
jest.unstable_mockModule('../src/notifier.mjs', () => ({ send: jest.fn().mockResolvedValue(undefined) }));
const { createRepo, sendNotification: sendRepoNotification, get } = await import('../src/repo.mjs');
const notifier = await import('../src/notifier.mjs');
const ConfigValidator = await import('../src/configValidator.mjs');

describe('repo.mjs', () => {
  const log = { info: jest.fn(), error: jest.fn() };
  const config = { pwd: '/tmp', pre: ['echo pre'], post: ['echo post'], user: 'root', group: 'root', notify: 'http://dummy' };
  const body = { ref: 'refs/heads/main', repository: { full_name: 'foo/bar' }, commits: [] };
  const execCommandFn = jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '' });
  const sendNotification = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses createRepo and update default arguments', async () => {
    expect(() => createRepo()).toThrow();
    const repo = createRepo({ config: { pwd: '/tmp' }, execCommandFn: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }) });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(repo.update({ body })).resolves.toBe(true);
    process.chdir.mockRestore();
  });

  it('should create a repo handler with update method', () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    expect(typeof repo.update).toBe('function');
  });

  it('should skip commands and only notify for tag push', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    const tagBody = { ...body, ref: 'refs/tags/v1.0.0' };
    await repo.update({ body: tagBody, log });
    expect(sendNotification).toHaveBeenCalled();
  });

  it('should handle error changing directory', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => { throw new Error('fail'); });
    await repo.update({ body, log });
    expect(log.error).toHaveBeenCalled();
    process.chdir.mockRestore();
  });

  it('should run pre and post commands and notify', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await repo.update({ body, log });
    expect(execCommandFn).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalled();
    process.chdir.mockRestore();
  });

  it('should reject invalid webhook bodies', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    expect(await repo.update({ body: {}, log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Repo] body validation failed');
  });

  it('should handle pre, git pull, chown, and post failures', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    execCommandFn
      .mockRejectedValueOnce(Object.assign(new Error('pre'), { stdout: 'out', stderr: 'err' }));
    expect(await repo.update({ body, log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Repo] Pre command failed: echo pre', expect.any(Error));
    process.chdir.mockRestore();
  });

  it('should handle git pull and post command failures', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    execCommandFn
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockRejectedValueOnce(new Error('pull'));
    expect(await repo.update({ body, log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Repo] git pull failed:', expect.any(Error));
    process.chdir.mockRestore();
  });

  it('uses configuration defaults and does not notify without a URL', async () => {
    const repo = createRepo({ config: { pwd: '/tmp' }, execCommandFn: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }) });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(repo.update({ body, log })).resolves.toBe(true);
    expect(repo.preCmds).toEqual([]);
    expect(repo.postCmds).toEqual([]);
    expect(repo.user).toBe('root');
    expect(repo.group).toBe('root');
    expect(repo.notify).toBeNull();
    process.chdir.mockRestore();
  });

  it('handles chown failure', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    execCommandFn
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockRejectedValueOnce(new Error('chown'));
    await expect(repo.update({ body, log })).resolves.toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Repo] chown failed:', expect.any(Error));
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ hasError: true }));
    process.chdir.mockRestore();
  });

  it('stops pre commands after the first failure', async () => {
    const repo = createRepo({ config: { ...config, pre: ['first', 'second'] }, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    execCommandFn.mockRejectedValueOnce(Object.assign(new Error('pre'), { stdout: '', stderr: '' }));
    await expect(repo.update({ body, log })).resolves.toBe(false);
    expect(execCommandFn).toHaveBeenCalledTimes(1);
    process.chdir.mockRestore();
  });

  it('stops post commands after the first failure', async () => {
    const repo = createRepo({ config: { ...config, post: ['first', 'second'] }, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    execCommandFn
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockRejectedValueOnce(Object.assign(new Error('post'), { stdout: '', stderr: '' }));
    await expect(repo.update({ body, log })).resolves.toBe(false);
    expect(execCommandFn).toHaveBeenCalledTimes(4);
    process.chdir.mockRestore();
  });

  it('handles post command failure and formats command output', async () => {
    const repo = createRepo({ config, log, execCommandFn, sendNotification });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    execCommandFn
      .mockResolvedValueOnce({ stdout: 'pre output\n', stderr: 'warning\n' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'chown output', stderr: '' })
      .mockRejectedValueOnce(Object.assign(new Error('post'), { stdout: 'bad output', stderr: 'bad error' }));
    await expect(repo.update({ body, log })).resolves.toBe(false);
    const notification = sendNotification.mock.calls.at(-1)[0];
    expect(notification.hasError).toBe(true);
    expect(notification.logOutput).toContain('ERRORS: \nbad error');
    expect(notification.logOutput).toContain('Exit Code: 1');
    process.chdir.mockRestore();
  });

  it('supports default notification implementation', async () => {
    const repo = createRepo({ config: { pwd: '/tmp', notify: null }, execCommandFn: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }) });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(repo.update({ body, log })).resolves.toBe(true);
    process.chdir.mockRestore();
  });

  it('returns null when repository config is missing', async () => {
    await expect(get({ name: 'does-not-exist' })).resolves.toBeNull();
  });

  it('sends notifications only for configured repositories', async () => {
    const repo = { notify: null };
    await sendRepoNotification({ repo, body, logOutput: '', hasError: false });
  });

  it('sends exported notifications for configured repositories', async () => {
    const repo = { notify: 'http://dummy' };
    await sendRepoNotification({ repo, body, logOutput: 'output', hasError: true, log });
    expect(notifier.send).toHaveBeenCalledWith({
      notifyUrl: repo.notify, post: body, logOutput: 'output', hasError: true, log
    });
  });

  it('covers missing config and validation branches', async () => {
    expect(() => ConfigValidator.validateJsonFile({ path: '/tmp/no-such-config.json', log })).toThrow();
    expect(ConfigValidator.validate({ config: null, log })).toBe(false);
    expect(ConfigValidator.validate({ config: 'invalid', log })).toBe(false);
    expect(ConfigValidator.validate({ config: {}, log })).toBe(false);
  });


  it('covers default command execution', async () => {
    const repo = createRepo({ config: { pwd: '/tmp', pre: ['printf ok'], notify: 'http://dummy' }, execCommandFn: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }) });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(repo.update({ body, log })).resolves.toBe(true);
    expect(notifier.send).toHaveBeenCalled();
    process.chdir.mockRestore();
  });

  it('pushes back tracked changes after a successful update', async () => {
    const calls = [];
    const exec = jest.fn(async ({ cmd }) => {
      calls.push(cmd);
      if (cmd === 'git diff --quiet') throw Object.assign(new Error('changes'), { code: 1 });
      return { stdout: '', stderr: '' };
    });
    const repo = createRepo({ config: { pwd: '/tmp', notify: null }, log, execCommandFn: exec });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(repo.update({ body, log })).resolves.toBe(true);
    expect(calls).toEqual(['git pull -q', 'chown -R root:root /tmp', 'git diff --quiet', 'git add -A', expect.stringMatching(/^git commit/), 'git push --quiet']);
    process.chdir.mockRestore();
  });

  it('propagates pushback command failures', async () => {
    const calls = [];
    const exec = jest.fn(async ({ cmd }) => {
      calls.push(cmd);
      if (cmd === 'git diff --quiet') throw new Error('changes');
      if (cmd === 'git add -A') throw new Error('pushback failed');
      return { stdout: '', stderr: '' };
    });
    const repo = createRepo({ config: { pwd: '/tmp', notify: null }, log, execCommandFn: exec });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(repo.update({ body, log })).rejects.toThrow('pushback failed');
    process.chdir.mockRestore();
  });

  it('covers default exec and config branches', async () => {
    const { writeFileSync, unlinkSync } = await import('node:fs');
    const malformed = `${process.cwd()}/repos/malformed.json`;
    const invalid = `${process.cwd()}/repos/invalid.json`;
    const valid = `${process.cwd()}/repos/valid.json`;
    writeFileSync(malformed, '{'); writeFileSync(invalid, '{}'); writeFileSync(valid, '{"pwd":"/tmp"}');
    await expect(get({ name: 'malformed', log })).resolves.toBeNull();
    await expect(get({ name: 'invalid', log })).resolves.toBeNull();
    await expect(get({ name: 'valid', log })).resolves.toMatchObject({ pwd: '/tmp' });
    unlinkSync(malformed); unlinkSync(invalid); unlinkSync(valid);

    const success = createRepo({ config: { pwd: '/tmp', pre: ['printf ok'] }, execCommandFn: jest.fn(async ({ cmd }) => ({ stdout: cmd === 'git diff --quiet' ? '' : 'ok', stderr: '' })) });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(success.update({ body, log })).resolves.toBe(true);
    process.chdir.mockRestore();
    const failure = createRepo({ config: { pwd: '/tmp', pre: ['false'] } });
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    await expect(failure.update({ body, log })).resolves.toBe(false);
    process.chdir.mockRestore();
  });
});
