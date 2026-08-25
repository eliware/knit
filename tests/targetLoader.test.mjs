import { jest } from '@jest/globals';
import { createTargetLoader } from '../src/targetLoader.mjs';

const target = { host: 'dev', user: 'root', identity: '/key', knownHosts: '/known', hostCa: '/ca' };

test('loads and caches the trusted target inventory', () => {
  const fsModule = { readFileSync: jest.fn().mockReturnValue('guildId: guild\ntargets:\n  dev:\n    host: dev\n    user: root\n    identity: /key\n    knownHosts: /known\n    hostCa: /ca') };
  const loader = createTargetLoader({ targetsPath: '/targets.yaml', fsModule });
  expect(loader.load()).toEqual({ guildId: 'guild', targets: { dev: target } });
  expect(loader.load()).toBe(loader.load());
  expect(fsModule.readFileSync).toHaveBeenCalledTimes(1);
  expect(loader.validateAll()).toBe(true);
});

test('rejects an invalid target inventory', () => {
  const loader = createTargetLoader({ fsModule: { readFileSync: jest.fn().mockReturnValue('targets: {}') } });
  expect(loader.validateAll()).toBe(false);
});
