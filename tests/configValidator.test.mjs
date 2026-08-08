import { jest } from '@jest/globals';
import { validate, isModern } from '../src/configValidator.mjs';

const base = { repository: 'owner/repo', git: { url: 'git@github.com:owner/repo.git', ref: 'main' }, targets: [{ host: 'dev.example', user: 'root', workingDirectory: '/srv/repo', pre: [], post: [] }], execution: { mode: 'sequential', stopOnError: true } };

test('accepts a complete modern SSH config', () => expect(validate({config: base})).toBe(true));
test('accepts notifyKey', () => expect(validate({config: {...base, notifyKey: 'owner__repo'}})).toBe(true));
test('rejects invalid configs', () => expect(validate({config: {}, log: {error: jest.fn()}})).toBe(false));
test('rejects local targets', () => expect(validate({config: {...base, targets: [{type: 'local', workingDirectory: '/tmp'}]}, log: {error: jest.fn()}})).toBe(false));
test('rejects unsafe notifyKey', () => expect(validate({config: {...base, notifyKey: '../secret'}, log: {error: jest.fn()}})).toBe(false));
test('isModern detects modern configs', () => { expect(isModern(base)).toBe(true); expect(isModern(null)).toBe(false); });
test.each([
  {identity: ''},
  {knownHosts: ''},
  {pre: ['ok', 1]},
  {post: ['ok', null]},
  {host: ''},
  {user: ''},
  {workingDirectory: ''},
])('rejects invalid SSH target: %j', field => expect(validate({config: {...base, targets: [{...base.targets[0], ...field}]}, log: {error: jest.fn()}})).toBe(false));
test.each([null, 'bad'])('rejects non-object SSH target: %j', target => expect(validate({config: {...base, targets: [target]}, log: {error: jest.fn()}})).toBe(false));
test('accepts SSH identity and knownHosts paths', () => expect(validate({config: {...base, targets: [{...base.targets[0], identity: 'ssh/id_rsa', knownHosts: 'ssh/known_hosts'}]}})).toBe(true));
test('rejects truthy non-object target', () => expect(validate({config: {...base, targets: [1]}, log: {error: jest.fn()}})).toBe(false));
test.each([false, true, 'target'])('rejects primitive target forms: %j', target => expect(validate({config: {...base, targets: [target]}, log: {error: jest.fn()}})).toBe(false));
test('accepts minimal SSH target defaults', () => expect(validate({config: {...base, targets: [{host: 'h', user: 'u', workingDirectory: '/tmp'}]}})).toBe(true));
