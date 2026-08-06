import fs from 'node:fs';
import path from 'node:path';
import * as Crypto from './crypto.mjs';
import * as Validator from './configValidator.mjs';
export function createConfigLoader({ fsModule = fs, crypto = Crypto, configPath = process.env.KNIT_CONFIG_REPO_PATH || path.resolve('repos'), legacyPath = path.resolve('repos'), log = console } = {}) {
  const cache = new Map();
  return { async load(name) {
    const candidates = [path.join(configPath, `${name}.json.age`), path.join(configPath, `${name}.json`), path.join(legacyPath, `${name}.json`)];
    const selected = candidates.find(p => fsModule.existsSync(p)); if (!selected) return null;
    const stat = fsModule.statSync(selected); const stamp = `${stat.mtimeMs}:${stat.size}:${stat.ino || ''}`; const old = cache.get(name);
    if (old?.path === selected && old.stamp === stamp) return old.config;
    try { const raw = selected.endsWith('.age') ? await crypto.decrypt(fsModule.readFileSync(selected), { identityFile: process.env.KNIT_AGE_IDENTITY_FILE }) : fsModule.readFileSync(selected, 'utf8'); const config = JSON.parse(Buffer.from(raw).toString('utf8')); if (!Validator.validate({ config, log })) return old?.config || null; cache.set(name, { path: selected, stamp, config }); return config; }
    catch (error) { log.error?.('Config load failed', { name, error: error.message }); return old?.config || null; }
  }, clear() { cache.clear(); } };
}
export const defaultLoader = createConfigLoader();
