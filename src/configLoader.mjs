import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import * as Validator from './configValidator.mjs';
export function createConfigLoader({ fsModule = fs, configPath = process.env.KNIT_CONFIG_PATH || path.resolve('repos'), log = console } = {}) {
  const cache = new Map();
  return { async load(name) {
    const configKey = name.replaceAll('/', '__');
    const candidates = [path.join(configPath, `${configKey}.yaml`), path.join(configPath, `${configKey}.yml`), ];
    const selected = candidates.find(p => fsModule.existsSync(p)); if (!selected) return null;
    const stat = fsModule.statSync(selected); const stamp = `${stat.mtimeMs}:${stat.size}:${stat.ino || ''}`; const old = cache.get(name);
    if (old?.path === selected && old.stamp === stamp) return old.config;
    try { const text = fsModule.readFileSync(selected, 'utf8'); const config = /\.(yaml|yml)$/.test(selected) ? yaml.load(text) : JSON.parse(text); if (!Validator.validate({ config, log })) return old?.config || null; cache.set(name, { path: selected, stamp, config }); return config; }
    catch (error) { log.error?.('Config load failed', { name, error: error.message }); return old?.config || null; }
  }, clear() { cache.clear(); } };
}
export const defaultLoader = createConfigLoader();
