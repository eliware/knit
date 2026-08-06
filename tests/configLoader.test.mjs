import { jest } from '@jest/globals';
import { createConfigLoader } from '../src/configLoader.mjs';
const config = { repository:'o/r', git:{url:'https://example.test/repo.git',ref:'main'}, targets:[{host:'h',user:'u',workingDirectory:'/x',pre:[],post:[]}], execution:{mode:'sequential',stopOnError:true} };
test('decrypts encrypted config and caches until changed', async () => {
 const files={'/c/o/r.json.age':Buffer.from('cipher')}; const crypto={decrypt:jest.fn(async()=>Buffer.from(JSON.stringify(config)))};
 const fs={existsSync:p=>p in files,readFileSync:p=>files[p],statSync:()=>({mtimeMs:1,size:1})}; const loader=createConfigLoader({fsModule:fs,crypto,configPath:'/c',legacyPath:'/l'});
 await loader.load('o/r'); await loader.load('o/r'); expect(crypto.decrypt).toHaveBeenCalledTimes(1);
});
test('malformed config does not replace cache', async()=>{ let good=true; const fs={existsSync:()=>true,readFileSync:()=>Buffer.from(JSON.stringify(good?config:{})),statSync:()=>({mtimeMs:good?1:2,size:1})}; const loader=createConfigLoader({fsModule:fs,crypto:{decrypt:async x=>x},configPath:'/c'}); expect(await loader.load('o/r')).toEqual(config); good=false; expect(await loader.load('o/r')).toEqual(config); });
