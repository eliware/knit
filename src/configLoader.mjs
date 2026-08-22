import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import * as Validator from './configValidator.mjs';
export function createConfigLoader({ fsModule = fs, configPath = process.env.KNIT_CONFIG_PATH || path.resolve('repos'), log = console } = {}) {
  const cache = new Map();
  return { async load(name) {
    const configKey = name.replaceAll('/', '__');
    const candidates = [path.join(configPath, `${configKey}.yaml`), path.join(configPath, `${configKey}.yml`), ];
    const selected = candidates.find(p => fsModule.existsSync(p)); if (!selected) return null;
    const old = cache.get(name);
    // Config changes are applied by restarting the pod when GitOps updates the
    // content-hashed ConfigMap. Do not inspect mounted files for live changes.
    if (old?.path === selected) return old.config;
    try { const text = fsModule.readFileSync(selected, 'utf8'); const config = yaml.load(text); if (!Validator.validate({ config, log })) return old?.config || null; cache.set(name, { path: selected, config }); return config; }
    catch (error) { log.error?.('Config load failed', { name, error: error.message }); return old?.config || null; }
  }, clear() { cache.clear(); } };
}
export const defaultLoader = createConfigLoader();
