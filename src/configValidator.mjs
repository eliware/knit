import { log as logger } from '@eliware/common';

const string = value => typeof value === 'string' && value.length > 0;
const commands = value => Array.isArray(value) && value.every(string);
const secretKey = value => typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value);

export function validate({ config, log = logger }) {
  const target = t => {
    if (!t) return false;
    if (typeof t !== 'object') return false;
    if (!string(t.workingDirectory) || !string(t.host) || !string(t.user)) return false;
    if (!commands(t.pre || []) || !commands(t.post || [])) return false;
    if ('identity' in t && !string(t.identity)) return false;
    if ('knownHosts' in t && !string(t.knownHosts)) return false;
    return true;
  };
  const modern = config && typeof config === 'object' && /^\S+\/\S+$/.test(config.repository || '') && config.git && typeof config.git === 'object' && string(config.git.url) && string(config.git.ref) && Array.isArray(config.targets) && config.targets.length > 0 && config.targets.every(target) && config.execution && config.execution.mode === 'sequential' && typeof config.execution.stopOnError === 'boolean';
  if (modern && config.notifyKey && !secretKey(config.notifyKey)) { log.error('ConfigValidator::validate failed: invalid notifyKey'); return false; }
  if (!modern) { log.error('ConfigValidator::validate failed: config invalid'); return false; }
  return true;
}

export function isModern(config) { return Boolean(config?.repository && config?.git && config?.targets); }
