import { jest } from '@jest/globals';
import { createConfigLoader } from '../src/configLoader.mjs';

const yamlConfig = `repository: o/r
targets:
  - host: h
    user: u
    workingDirectory: /x
    commands:
      - git pull --ff-only
      - npm test
execution:
  mode: sequential
  stopOnError: true
`;
function mockKey(file) { return file.replaceAll(/\\/g, '/').replace(/^[A-Za-z]:/, ''); }
function fsMock(files) { return { existsSync: jest.fn(p => mockKey(p) in files), readFileSync: jest.fn(p => files[mockKey(p)]), statSync: jest.fn() }; }

test('returns null when no YAML config exists', async () => expect(await createConfigLoader({fsModule: fsMock({}), configPath: '/c'}).load('o/r')).toBeNull());
test('loads and caches YAML using repository filename mapping', async () => { const fs=fsMock({'/c/o__r.yaml': yamlConfig}); const loader=createConfigLoader({fsModule: fs, configPath: '/c'}); expect(await loader.load('o/r')).toMatchObject({repository: 'o/r'}); await loader.load('o/r'); expect(fs.readFileSync).toHaveBeenCalledTimes(1); });
test('does not inspect files for changes after caching', async () => { const fs=fsMock({'/c/o__r.yaml': yamlConfig}); const loader=createConfigLoader({fsModule:fs, configPath:'/c'}); await loader.load('o/r'); await loader.load('o/r'); expect(fs.statSync).not.toHaveBeenCalled(); expect(fs.readFileSync).toHaveBeenCalledTimes(1); });
test('logs load errors and returns null without a cached config', async () => { const log={error:jest.fn()}; const fs=fsMock({'/c/o__r.yaml':yamlConfig}); const loader=createConfigLoader({fsModule:fs,configPath:'/c',log}); fs.readFileSync.mockImplementation(()=>{throw new Error('read failed')}); expect(await loader.load('o/r')).toBeNull(); expect(log.error).toHaveBeenCalled(); });
test('clear forces a reload', async () => { const fs=fsMock({'/c/o__r.yaml':yamlConfig}); const loader=createConfigLoader({fsModule:fs,configPath:'/c'}); await loader.load('o/r'); loader.clear(); await loader.load('o/r'); expect(fs.readFileSync).toHaveBeenCalledTimes(2); });
test('loads .yml configuration', async () => { const fs=fsMock({'/c/o__r.yml':yamlConfig}); const loader=createConfigLoader({fsModule:fs,configPath:'/c'}); expect(await loader.load('o/r')).toMatchObject({repository:'o/r'}); });
test('logs parse errors and returns null without cache', async () => { const log={error:jest.fn()}; const loader=createConfigLoader({fsModule:fsMock({'/c/o__r.yaml':'[bad'}),configPath:'/c',log}); expect(await loader.load('o/r')).toBeNull(); expect(log.error).toHaveBeenCalledWith('Config load failed',expect.objectContaining({name:'o/r'})); });
test('returns null when validation fails on first load', async () => { const log={error:jest.fn()}; const loader=createConfigLoader({fsModule:fsMock({'/c/o__r.yaml':'repository: bad'}),configPath:'/c',log}); expect(await loader.load('o/r')).toBeNull(); expect(log.error).toHaveBeenCalled(); });
