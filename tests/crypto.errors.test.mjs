import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';

const spawn = jest.fn();
jest.unstable_mockModule('node:child_process', () => ({ spawn }));
const { encrypt, decrypt } = await import('../src/crypto.mjs');

function child({ code = 0, stderr = '', error } = {}) {
  const process = new EventEmitter();
  process.stdout = new EventEmitter();
  process.stderr = new EventEmitter();
  process.stdin = { end: jest.fn() };
  queueMicrotask(() => {
    if (error) process.emit('error', error);
    else {
      if (stderr) process.stderr.emit('data', Buffer.from(stderr));
      process.emit('close', code);
    }
  });
  return process;
}

describe('crypto age process failures', () => {
  beforeEach(() => spawn.mockReset());

  it('wraps spawn errors with the cause', async () => {
    const cause = new Error('missing age');
    spawn.mockReturnValue(child({ error: cause }));
    await expect(encrypt('secret', { recipient: 'age1test' })).rejects.toMatchObject({
      message: 'age encryption operation failed: missing age',
      cause
    });
  });

  it('uses stderr for nonzero age exits', async () => {
    spawn.mockReturnValue(child({ code: 2, stderr: 'bad recipient\n' }));
    await expect(encrypt('secret', { recipient: 'age1test' })).rejects.toThrow('bad recipient');
  });

  it('reports nonzero exits without stderr', async () => {
    spawn.mockReturnValue(child({ code: 9 }));
    await expect(decrypt('ciphertext', { identityFile: 'identity.txt' })).rejects.toThrow('age exited with code 9');
  });
});
