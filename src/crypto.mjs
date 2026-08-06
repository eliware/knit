import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const ageBinary = process.env.KNIT_AGE_BINARY || 'age';

function recipientFromEnv() {
  return process.env.KNIT_CONFIG_RECIPIENT || process.env.KNIT_AGE_RECIPIENT || '';
}

function identityFromEnv() {
  return process.env.KNIT_AGE_IDENTITY_FILE || process.env.KNIT_AGE_KEY_FILE || '';
}

export function isEncryptionConfigured(env = process.env) {
  return Boolean(env.KNIT_CONFIG_RECIPIENT || env.KNIT_AGE_RECIPIENT || env.KNIT_AGE_IDENTITY_FILE || env.KNIT_AGE_KEY_FILE);
}

async function runAge(args, input) {
  try {
    const result = await execFileAsync(ageBinary, args, { input, maxBuffer: 16 * 1024 * 1024 });
    return Buffer.from(result.stdout);
  } catch (error) {
    throw new Error(`age encryption operation failed: ${error.stderr?.trim() || error.message}`, { cause: error });
  }
}

export async function encrypt(data, { recipient = recipientFromEnv() } = {}) {
  if (!recipient) throw new Error('An age recipient is required');
  const input = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  return runAge(['--encrypt', '--recipient', recipient], input);
}

export async function decrypt(data, { identityFile = identityFromEnv() } = {}) {
  if (!identityFile) throw new Error('An age identity file is required');
  const input = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  return runAge(['--decrypt', '--identity', identityFile], input);
}

export async function encryptFile(inputPath, outputPath, options = {}) {
  const encrypted = await encrypt(await fs.readFile(inputPath), options);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, encrypted, { mode: 0o600 });
  return outputPath;
}

export async function decryptFile(inputPath, outputPath, options = {}) {
  const decrypted = await decrypt(await fs.readFile(inputPath), options);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, decrypted, { mode: 0o600 });
  return outputPath;
}

export async function encryptJson(value, options = {}) {
  return encrypt(`${JSON.stringify(value, null, 2)}\n`, options);
}

export async function decryptJson(data, options = {}) {
  return JSON.parse((await decrypt(data, options)).toString('utf8'));
}
