import { log as logger } from '@eliware/common';
import fs from 'node:fs';

export function validateJsonFile({ path, log = logger, fsModule = fs }) {
  if (!fsModule.existsSync(path)) { log.error(`Config file not found: ${path}`); throw new Error(`Config file not found: ${path}`); }
  try { return JSON.parse(fsModule.readFileSync(path, 'utf8')); }
  catch (e) { log.error(`Invalid JSON in ${path}: ${e.message}`); throw new Error(`Invalid JSON in ${path}: ${e.message}`); }
}
const string = value => typeof value === 'string' && value.length > 0;
const commands = value => Array.isArray(value) && value.every(string);
export function validate({ config, log = logger }) {
  const legacy = config && typeof config === 'object' && string(config.pwd) && commands(config.pre || []) && commands(config.post || []);
  const target = t => t && typeof t === 'object' && string(t.workingDirectory) && (t.type === 'local' || (string(t.host) && string(t.user))) && commands(t.pre || []) && commands(t.post || []) && (!('identity' in t) || string(t.identity)) && (!('knownHosts' in t) || string(t.knownHosts));
  const modern = config && typeof config === 'object' && /^\S+\/\S+$/.test(config.repository || '') && config.git && typeof config.git === 'object' && string(config.git.url) && string(config.git.ref) && Array.isArray(config.targets) && config.targets.length > 0 && config.targets.every(target) && config.execution && config.execution.mode === 'sequential' && typeof config.execution.stopOnError === 'boolean';
  if (!legacy && !modern) { log.error('ConfigValidator::validate failed: config invalid'); return false; }
  return true;
}
export function isModern(config) { return Boolean(config?.repository && config?.git && config?.targets); }
