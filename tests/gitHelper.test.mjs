import { jest } from '@jest/globals';
const realExec = jest.fn();
jest.unstable_mockModule('child_process', () => ({ exec: realExec }));
const gitHelper = await import('../src/gitHelper.mjs');

describe('gitHelper.mjs', () => {
  const log = { error: jest.fn(), info: jest.fn() };
  let exec;

  beforeEach(() => {
    jest.clearAllMocks();
    exec = jest.fn();
  });

  it('add: resolves stdout and logs success', async () => {
    exec.mockImplementation((cmd, cb) => {
      expect(cmd).toBe('git add "foo"');
      cb(null, 'ok', '');
    });

    await expect(gitHelper.add({ filePath: 'foo', log, exec })).resolves.toBe('ok');
    expect(log.info).toHaveBeenCalledWith('git add success: foo');
  });

  it('add: rejects and logs stderr on error', async () => {
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', 'fail'));

    await expect(gitHelper.add({ filePath: 'foo', log, exec })).rejects.toThrow('git add error: fail');
    expect(log.error).toHaveBeenCalledWith('git add error: fail');
  });

  it('add: uses the default logger when omitted', async () => {
    exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));

    await expect(gitHelper.add({ filePath: 'foo', exec })).resolves.toBe('ok');
  });

  it('commit: resolves stdout, logs success, and escapes quotes', async () => {
    exec.mockImplementation((cmd, cb) => {
      expect(cmd).toBe('git commit --quiet -m "say \\"hi\\""');
      cb(null, 'ok', '');
    });

    await expect(gitHelper.commit({ message: 'say "hi"', log, exec })).resolves.toBe('ok');
    expect(log.info).toHaveBeenCalledWith('git commit success');
  });

  it('commit: rejects and logs stderr on error', async () => {
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', 'fail'));

    await expect(gitHelper.commit({ message: 'msg', log, exec })).rejects.toThrow('git commit error: fail');
    expect(log.error).toHaveBeenCalledWith('git commit error: fail');
  });

  it('commit: uses the default logger when omitted', async () => {
    exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));

    await expect(gitHelper.commit({ message: 'msg', exec })).resolves.toBe('ok');
  });

  it('push: resolves stdout', async () => {
    exec.mockImplementation((cmd, cb) => {
      expect(cmd).toBe('git push --quiet');
      cb(null, 'ok', '');
    });

    await expect(gitHelper.push({ exec })).resolves.toBe('ok');
  });

  it('push: rejects and includes stderr on error', async () => {
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', 'fail'));

    await expect(gitHelper.push({ exec })).rejects.toThrow('git push error: fail');
  });

  it('uses the default exec when omitted', async () => {
    realExec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));

    await expect(gitHelper.add({ filePath: 'foo' })).resolves.toBe('ok');
    await expect(gitHelper.commit({ message: 'msg' })).resolves.toBe('ok');
    await expect(gitHelper.push()).resolves.toBe('ok');
    expect(realExec).toHaveBeenCalledTimes(3);
  });
});
