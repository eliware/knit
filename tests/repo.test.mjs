import { jest } from '@jest/globals';
import { createRepo } from '../src/repo.mjs';

describe('repo.mjs', () => {
  const log = { info: jest.fn(), error: jest.fn() };
  const config = { pwd: '/tmp', pre: ['echo pre'], post: ['echo post'], user: 'root', group: 'root', notify: 'http://dummy' };
  const body = { ref: 'refs/heads/main', repository: { full_name: 'foo/bar' }, commits: [] };
  const execCommandFn = jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '' });
  const sendNotification = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
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

});
