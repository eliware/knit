import { jest } from '@jest/globals';
import { createConfigLoader } from '../src/configLoader.mjs';

const config = { repository:'o/r', git:{url:'https://example.test/repo.git',ref:'main'}, targets:[{host:'h',user:'u',workingDirectory:'/x',pre:[],post:[]}], execution:{mode:'sequential',stopOnError:true} };
const validJson = JSON.stringify(config);

function fsMock(files, stats = {}) {
 return {
  existsSync: jest.fn(path => path in files),
  readFileSync: jest.fn(path => files[path]),
  statSync: jest.fn(path => stats[path] || {mtimeMs:1,size:1}),
 };
}

test('returns null when no config candidate exists', async () => {
 const loader = createConfigLoader({fsModule:fsMock({}), configPath:'/c', legacyPath:'/l'});
 expect(await loader.load('o/r')).toBeNull();
});

test('loads plain config and caches until changed', async () => {
 const files = {'/c/o/r.json':validJson};
 const fs = fsMock(files);
 const loader = createConfigLoader({fsModule:fs, configPath:'/c', legacyPath:'/l'});
 expect(await loader.load('o/r')).toEqual(config);
 expect(await loader.load('o/r')).toEqual(config);
 expect(fs.readFileSync).toHaveBeenCalledTimes(1);
});


test('loads YAML configuration', async () => {
 const files = {'/c/o__r.yaml': `repository: o/r
notifyKey: o__r
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
`};
 const loader = createConfigLoader({fsModule:fsMock(files), configPath:'/c', legacyPath:'/l'});
 expect(await loader.load('o/r')).toMatchObject({...config, notifyKey: 'o__r'});
});

test('uses legacy config when preferred candidates are absent', async () => {
 const loader = createConfigLoader({fsModule:fsMock({'/l/o/r.json':validJson}), configPath:'/c', legacyPath:'/l'});
 expect(await loader.load('o/r')).toEqual(config);
});

test('invalid config does not replace cache', async () => {
 let good = true;
 const fs = fsMock({'/c/o/r.json':validJson}, {'/c/o/r.json':{mtimeMs:1,size:1}});
 fs.readFileSync.mockImplementation(() => good ? validJson : '{}');
 const loader = createConfigLoader({fsModule:fs, configPath:'/c'});
 expect(await loader.load('o/r')).toEqual(config);
 fs.statSync.mockReturnValue({mtimeMs:2,size:1});
 good = false;
 expect(await loader.load('o/r')).toEqual(config);
});

test('returns null for invalid first load', async () => {
 const log = {error:jest.fn()};
 const loader = createConfigLoader({fsModule:fsMock({'/c/o/r.json':'{}'}), configPath:'/c', log});
 expect(await loader.load('o/r')).toBeNull();
 expect(log.error).toHaveBeenCalled();
});

test('logs load errors and returns cached config', async () => {
 const log = {error:jest.fn()};
 const fs = fsMock({'/c/o/r.json':validJson}, {'/c/o/r.json':{mtimeMs:1,size:1}});
 const loader = createConfigLoader({fsModule:fs, configPath:'/c', log});
 expect(await loader.load('o/r')).toEqual(config);
 fs.statSync.mockReturnValue({mtimeMs:2,size:1});
 fs.readFileSync.mockImplementation(() => { throw new Error('read failed'); });
 expect(await loader.load('o/r')).toEqual(config);
 expect(log.error).toHaveBeenCalledWith('Config load failed', expect.objectContaining({name:'o/r', error:'read failed'}));
});

test('logs load errors and returns null without cached config', async () => {
 const log = {error:jest.fn()};
 const loader = createConfigLoader({fsModule:fsMock({'/c/o/r.json':'bad'}), configPath:'/c', log});
 expect(await loader.load('o/r')).toBeNull();
 expect(log.error).toHaveBeenCalledWith('Config load failed', expect.objectContaining({name:'o/r'}));
});

test('clear forces a reload', async () => {
 const fs = fsMock({'/c/o/r.json':validJson});
 const loader = createConfigLoader({fsModule:fs, configPath:'/c'});
 await loader.load('o/r'); loader.clear(); await loader.load('o/r');
 expect(fs.readFileSync).toHaveBeenCalledTimes(2);
});
