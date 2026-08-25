import { log as logger } from '@eliware/common';

const string = value => typeof value === 'string' && value.length > 0;
const commands = value => Array.isArray(value) && value.length > 0 && value.every(string);
const channelId = value => typeof value === 'string' && /^\d{17,20}$/.test(value);

export function validate({ config, log = logger }) {
  const target = t => {
    if (!t) return false;
    if (typeof t !== 'object') return false;
    if (!string(t.workingDirectory) || !string(t.host) || !string(t.user)) return false;
    if (!commands(t.commands) || 'pre' in t || 'post' in t) return false;
    if ('identity' in t && !string(t.identity)) return false;
    if ('knownHosts' in t && !string(t.knownHosts)) return false;
    if ('hostCa' in t && !string(t.hostCa)) return false;
    return true;
  };
  const modern = config && typeof config === 'object' && /^\S+\/\S+$/.test(config.repository || '') && Array.isArray(config.targets) && config.targets.length > 0 && config.targets.every(target) && config.execution && config.execution.mode === 'sequential' && typeof config.execution.stopOnError === 'boolean';
  if (modern && config.notifyKey !== undefined) { log.error('ConfigValidator::validate failed: notifyKey is obsolete; use discordChannelId'); return false; }
  if (modern && config.discordChannelId !== undefined && !channelId(config.discordChannelId)) { log.error('ConfigValidator::validate failed: invalid discordChannelId'); return false; }
  if (!modern) { log.error('ConfigValidator::validate failed: config invalid'); return false; }
  return true;
}

export function isModern(config) { return Boolean(config?.repository && config?.targets?.length && config.targets.every(target => commands(target.commands))); }
