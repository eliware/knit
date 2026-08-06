// Tests for src/configValidator.mjs
import { jest } from '@jest/globals';
import { validateJsonFile, validate, isModern } from '../src/configValidator.mjs';
import fs from 'fs';

describe('configValidator.mjs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const log = { error: jest.fn() };
    expect(() => validateJsonFile({ path: 'bad.json', log })).toThrow('Config file not found: bad.json');
    expect(log.error).toHaveBeenCalled();
  });

  it('should throw if file is invalid JSON', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('not json');
    const log = { error: jest.fn() };
    expect(() => validateJsonFile({ path: 'bad.json', log })).toThrow(/Invalid JSON/);
    expect(log.error).toHaveBeenCalled();
  });

  it('should return parsed JSON if valid', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{"pwd":"/tmp"}');
    const log = { error: jest.fn() };
    expect(validateJsonFile({ path: 'good.json', log })).toEqual({ pwd: '/tmp' });
  });

  it('should use the default logger for valid JSON', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{"pwd":"/tmp"}');
    expect(validateJsonFile({ path: 'good.json' })).toEqual({ pwd: '/tmp' });
  });

  it('should return false if config is invalid', () => {
    const log = { error: jest.fn() };
    expect(validate({ config: null, log })).toBe(false);
    expect(validate({ config: {}, log })).toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('should return false for non-object configs', () => {
    const log = { error: jest.fn() };
    expect(validate({ config: 'invalid', log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('ConfigValidator::validate failed: config invalid');
  });

  it('should return false when pwd is missing', () => {
    const log = { error: jest.fn() };
    expect(validate({ config: { name: 'knit' }, log })).toBe(false);
    expect(log.error).toHaveBeenCalledWith('ConfigValidator::validate failed: config invalid');
  });

  it('should use the default logger for valid configs', () => {
    expect(validate({ config: { pwd: '/tmp' } })).toBe(true);
  });
});

  it('validates a complete modern SSH config', () => {
    expect(validate({ config: {
      repository: 'owner/repo',
      git: { url: 'git@github.com:owner/repo.git', ref: 'main' },
      targets: [{ host: 'dev.example', user: 'root', workingDirectory: '/srv/repo', pre: [], post: [], identity: 'host-installed', knownHosts: 'owner/ssh/known_hosts' }],
      execution: { mode: 'sequential', stopOnError: true }
    } })).toBe(true);
  });

  it.each([
    { repository: 'owner/repo', git: { ref: 'main' }, targets: [], execution: { mode: 'sequential', stopOnError: true } },
    { repository: 'owner/repo', git: { url: 'url', ref: 'main' }, targets: [{ host: '', user: 'root', workingDirectory: '/x' }], execution: { mode: 'sequential', stopOnError: true } },
    { repository: 'owner/repo', git: { url: 'url', ref: 'main' }, targets: [{ host: 'h', user: 'u', workingDirectory: '/x', pre: ['ok', 1] }], execution: { mode: 'sequential', stopOnError: true } },
    { repository: 'owner/repo', git: { url: 'url', ref: 'main' }, targets: [{ host: 'h', user: 'u', workingDirectory: '/x' }], execution: { mode: 'parallel', stopOnError: true } },
  ])('rejects malformed modern configs', config => {
    expect(validate({ config, log: { error: jest.fn() } })).toBe(false);
  });


  describe('isModern', () => {
    it('returns false for missing config', () => {
      expect(isModern(null)).toBe(false);
    });

    it('returns true when modern config markers are present', () => {
      expect(isModern({ repository: 'owner/repo', git: {}, targets: [] })).toBe(true);
    });
  });
