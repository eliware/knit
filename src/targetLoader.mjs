import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import { validateTargets } from './configValidator.mjs';

const defaultPath = process.env.KNIT_TARGETS_PATH || path.join(process.env.KNIT_CONFIG_PATH || path.resolve('repos'), 'targets.yaml');

export function createTargetLoader({ targetsPath = defaultPath, fsModule = fs } = {}) {
  let cache;
  const load = () => {
    if (cache) return cache;
    const document = yaml.load(fsModule.readFileSync(targetsPath, 'utf8'));
    cache = document;
    return cache;
  };
  return { load, validateAll: () => validateTargets({ config: load() }) };
}

export const defaultTargetLoader = createTargetLoader();
