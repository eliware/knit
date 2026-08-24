import { jest } from '@jest/globals';
import { validate, isModern } from '../src/configValidator.mjs';

const base = { repository: 'owner/repo', targets: [{ host: 'dev.example', user: 'root', workingDirectory: '/srv/repo', commands: ['git pull --ff-only'] }], execution: { mode: 'sequential', stopOnError: true } };

test('accepts a complete modern SSH config', () => expect(validate({config: base})).toBe(true));
test('accepts a Discord channel snowflake', () => expect(validate({config: {...base, discordChannelId: '123456789012345678'}})).toBe(true));
test('rejects obsolete notifyKey', () => expect(validate({config: {...base, notifyKey: 'owner__repo'}, log: {error: jest.fn()}})).toBe(false));
test.each(['123', 'not-a-channel', true])('rejects invalid Discord channel IDs: %j', discordChannelId => expect(validate({config: {...base, discordChannelId}, log: {error: jest.fn()}})).toBe(false));
test('rejects invalid configs', () => expect(validate({config: {}, log: {error: jest.fn()}})).toBe(false));
test('rejects local targets', () => expect(validate({config: {...base, targets: [{type: 'local', workingDirectory: '/tmp'}]}, log: {error: jest.fn()}})).toBe(false));
test('isModern detects modern configs', () => { expect(isModern(base)).toBe(true); expect(isModern(null)).toBe(false); });
test.each([
  {identity: ''},
  {knownHosts: ''},
  {commands: []},
  {commands: ['ok', 1]},
  {host: ''},
  {user: ''},
  {workingDirectory: ''},
])('rejects invalid SSH target: %j', field => expect(validate({config: {...base, targets: [{...base.targets[0], ...field}]}, log: {error: jest.fn()}})).toBe(false));
test.each([null, 'bad'])('rejects non-object SSH target: %j', target => expect(validate({config: {...base, targets: [target]}, log: {error: jest.fn()}})).toBe(false));
test('accepts SSH identity and knownHosts paths', () => expect(validate({config: {...base, targets: [{...base.targets[0], identity: 'ssh/id_rsa', knownHosts: 'ssh/known_hosts'}]}})).toBe(true));
test('rejects truthy non-object target', () => expect(validate({config: {...base, targets: [1]}, log: {error: jest.fn()}})).toBe(false));
test.each([false, true, 'target'])('rejects primitive target forms: %j', target => expect(validate({config: {...base, targets: [target]}, log: {error: jest.fn()}})).toBe(false));
test('accepts minimal SSH target defaults', () => expect(validate({config: {...base, targets: [{host: 'h', user: 'u', workingDirectory: '/tmp', commands: ['echo ok']}]}})).toBe(true));
