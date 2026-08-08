import { jest } from '@jest/globals';
import { createSecretResolver } from '../src/secretResolver.mjs';

function fsMock(files) {
  return {
    existsSync: jest.fn(file => file in files),
    readFileSync: jest.fn(file => files[file]),
  };
}

test('resolves a webhook URL from a Secret-mounted file', () => {
  const fs = fsMock({'/secrets/eliware__example': ' https://discord.test/webhook\n'});
  const resolver = createSecretResolver({fsModule: fs, secretPath: '/secrets'});
  expect(resolver.resolve('eliware__example')).toBe('https://discord.test/webhook');
});

test('returns null for absent, empty, or missing keys', () => {
  const fs = fsMock({'/secrets/empty': ' \n'});
  const resolver = createSecretResolver({fsModule: fs, secretPath: '/secrets'});
  expect(resolver.resolve()).toBeNull();
  expect(resolver.resolve('missing')).toBeNull();
  expect(resolver.resolve('empty')).toBeNull();
});

test('rejects unsafe keys', () => {
  const resolver = createSecretResolver({fsModule: fsMock({}), secretPath: '/secrets'});
  expect(() => resolver.resolve('../secret')).toThrow('Invalid notification secret key');
  expect(() => resolver.resolve('owner/repo')).toThrow('Invalid notification secret key');
});
