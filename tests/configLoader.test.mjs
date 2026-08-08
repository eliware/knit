import { jest } from '@jest/globals';
import { createConfigLoader } from '../src/configLoader.mjs';

const yamlConfig = `repository: o/r
git:
  url: https://example.test/repo.git
  ref: main
targets:
  - host: h
    user: u
    workingDirectory: /x
    pre: []
    post: []
execution:
  mode: sequential
  stopOnError: true
`;
function fsMock(files, stats = {}) { return { existsSync: jest.fn(p => p in files), readFileSync: jest.fn(p => files[p]), statSync: jest.fn(p => stats[p] || {mtimeMs: 1, size: 1}) }; }

test('returns null when no YAML config exists', async () => expect(await createConfigLoader({fsModule: fsMock({}), configPath: '/c'}).load('o/r')).toBeNull());
test('loads and caches YAML using repository filename mapping', async () => { const fs=fsMock({'/c/o__r.yaml': yamlConfig}); const loader=createConfigLoader({fsModule: fs, configPath: '/c'}); expect(await loader.load('o/r')).toMatchObject({repository: 'o/r'}); await loader.load('o/r'); expect(fs.readFileSync).toHaveBeenCalledTimes(1); });
test('invalid YAML config does not replace cache', async () => { const fs=fsMock({'/c/o__r.yaml': yamlConfig},{'/c/o__r.yaml':{mtimeMs:1,size:1}}); const loader=createConfigLoader({fsModule:fs, configPath:'/c'}); expect(await loader.load('o/r')).toBeTruthy(); fs.statSync.mockReturnValue({mtimeMs:2,size:1}); fs.readFileSync.mockReturnValue('{}'); expect(await loader.load('o/r')).toBeTruthy(); });
test('logs load errors and returns cached config', async () => { const log={error:jest.fn()}; const fs=fsMock({'/c/o__r.yaml':yamlConfig},{'/c/o__r.yaml':{mtimeMs:1,size:1}}); const loader=createConfigLoader({fsModule:fs,configPath:'/c',log}); expect(await loader.load('o/r')).toBeTruthy(); fs.statSync.mockReturnValue({mtimeMs:2,size:1}); fs.readFileSync.mockImplementation(()=>{throw new Error('read failed')}); expect(await loader.load('o/r')).toBeTruthy(); expect(log.error).toHaveBeenCalled(); });
test('clear forces a reload', async () => { const fs=fsMock({'/c/o__r.yaml':yamlConfig}); const loader=createConfigLoader({fsModule:fs,configPath:'/c'}); await loader.load('o/r'); loader.clear(); await loader.load('o/r'); expect(fs.readFileSync).toHaveBeenCalledTimes(2); });
test('loads .yml configuration', async () => { const fs=fsMock({'/c/o__r.yml':yamlConfig}); const loader=createConfigLoader({fsModule:fs,configPath:'/c'}); expect(await loader.load('o/r')).toMatchObject({repository:'o/r'}); });
test('logs parse errors and returns null without cache', async () => { const log={error:jest.fn()}; const loader=createConfigLoader({fsModule:fsMock({'/c/o__r.yaml':'[bad'}),configPath:'/c',log}); expect(await loader.load('o/r')).toBeNull(); expect(log.error).toHaveBeenCalledWith('Config load failed',expect.objectContaining({name:'o/r'})); });
test('returns null when validation fails on first load', async () => { const log={error:jest.fn()}; const loader=createConfigLoader({fsModule:fsMock({'/c/o__r.yaml':'repository: bad'}),configPath:'/c',log}); expect(await loader.load('o/r')).toBeNull(); expect(log.error).toHaveBeenCalled(); });
