#!/usr/bin/env node
import fs from 'node:fs/promises';
import { encrypt, decrypt } from './src/crypto.mjs';

const [command, inputPath, outputPath] = process.argv.slice(2);
if (!['encrypt', 'decrypt'].includes(command) || !inputPath || !outputPath) {
  console.error('Usage: node crypto.mjs <encrypt|decrypt> <input> <output>');
  process.exitCode = 2;
} else {
  const data = await fs.readFile(inputPath);
  const result = command === 'encrypt' ? await encrypt(data) : await decrypt(data);
  await fs.writeFile(outputPath, result, { mode: 0o600 });
}
