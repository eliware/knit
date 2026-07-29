import { jest } from '@jest/globals';
// Tests for src/gitHelper.mjs
import * as gitHelper from '../src/gitHelper.mjs';

describe('gitHelper.mjs', () => {
  const log = { error: jest.fn(), info: jest.fn() };
  let exec;
  beforeEach(() => {
    jest.clearAllMocks();
    exec = jest.fn();
  });

  it('add: should resolve on success', async () => {
    exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
    await expect(gitHelper.add({ filePath: 'foo', log, exec })).resolves.toBe('ok');
    expect(log.info).toHaveBeenCalled();
  });

  it('add: should reject on error', async () => {
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', 'fail'));
    await expect(gitHelper.add({ filePath: 'foo', log, exec })).rejects.toThrow('git add error: fail');
    expect(log.error).toHaveBeenCalled();
  });

  it('commit: should resolve on success', async () => {
    exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
    await expect(gitHelper.commit({ message: 'msg', log, exec })).resolves.toBe('ok');
    expect(log.info).toHaveBeenCalled();
  });

  it('commit: should reject on error', async () => {
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', 'fail'));
    await expect(gitHelper.commit({ message: 'msg', log, exec })).rejects.toThrow('git commit error: fail');
    expect(log.error).toHaveBeenCalled();
  });

  it('push: should resolve on success', async () => {
    exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
    await expect(gitHelper.push({ exec })).resolves.toBe('ok');
  });

  it('push: should reject on error', async () => {
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', 'fail'));
    await expect(gitHelper.push({ exec })).rejects.toThrow('git push error: fail');
  });
});
