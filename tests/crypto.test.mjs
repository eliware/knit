import { jest } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { encrypt, decrypt, encryptFile, decryptFile, encryptJson, decryptJson, isEncryptionConfigured } from '../src/crypto.mjs';
const exec = promisify(execFile);

describe('crypto', () => {
  let dir; let identity; let recipient;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'knit-crypto-'));
    identity = path.join(dir, 'keys.txt');
    const { stdout } = await exec('age-keygen', ['-o', identity]);
    recipient = stdout.trim().match(/age1\w+/)?.[0];
  });
  afterEach(() => fs.rm(dir, { recursive: true, force: true }));

  it('reports configured env values', () => {
    expect(isEncryptionConfigured({ KNIT_CONFIG_RECIPIENT: recipient })).toBe(true);
    expect(isEncryptionConfigured({})).toBe(false);
  });
  it('encrypts and decrypts data', async () => {
    const encrypted = await encrypt('secret', { recipient });
    await expect(decrypt(encrypted, { identityFile: identity })).resolves.toEqual(Buffer.from('secret'));
  });
  it('requires key configuration', async () => {
    await expect(encrypt('x')).rejects.toThrow('recipient is required');
    await expect(decrypt('x')).rejects.toThrow('identity file is required');
  });
  it('encrypts and decrypts files', async () => {
    const input = path.join(dir, 'input'); const encrypted = path.join(dir, 'input.age'); const output = path.join(dir, 'output');
    await fs.writeFile(input, 'file');
    await encryptFile(input, encrypted, { recipient });
    await decryptFile(encrypted, output, { identityFile: identity });
    await expect(fs.readFile(output, 'utf8')).resolves.toBe('file');
  });
  it('round trips JSON', async () => {
    const value = { key: 'value', nested: [1, 2] };
    await expect(decryptJson(await encryptJson(value, { recipient }), { identityFile: identity })).resolves.toEqual(value);
  });
  it('wraps age failures', async () => {
    await expect(decrypt(Buffer.from('not age'), { identityFile: identity })).rejects.toThrow('age encryption operation failed');
  });
});
