import { log as logger } from '@eliware/common';

const string = value => typeof value === 'string' && value.length > 0;
const commands = value => Array.isArray(value) && value.length > 0 && value.every(string);
export function validateWorkflow({ config, log = logger }) {
  const validDeployment = deployment => typeof deployment === 'object' && string(deployment.target) && string(deployment.cwd) && deployment.cwd.startsWith('/') && commands(deployment.commands);
  const validAction = action => action && Array.isArray(action.deployments) && action.deployments.length > 0 && action.deployments.every(validDeployment);
  const tags = config?.on?.tags;
  const validTags = tags && typeof tags === 'object' && Object.keys(tags).length > 0 && Object.keys(tags).every(pattern => /^v\*?$/.test(pattern) && validAction(tags[pattern]));
  const valid = config?.version === 1 && validAction(config?.on?.push) && validTags;
  if (!valid) log.error('ConfigValidator::validateWorkflow failed: invalid .knit/deploy.yaml');
  return valid;
}

export function selectWorkflowAction({ config, post = {} } = {}) {
  if (post.ref?.startsWith('refs/tags/')) {
    const tag = post.ref.slice('refs/tags/'.length);
    const pattern = Object.keys(config.on.tags).find(candidate => candidate === tag || (candidate.endsWith('*') && tag.startsWith(candidate.slice(0, -1))));
    return pattern ? config.on.tags[pattern] : null;
  }
  return config.on.push;
}

export function validateTargets({ config, log = logger }) {
  const targets = config?.targets;
  const valid = string(config?.guildId) && targets && typeof targets === 'object' && Object.values(targets).length > 0 && Object.values(targets).every(target =>
    target && string(target.host) && string(target.user) && string(target.identity) && string(target.knownHosts) && string(target.hostCa));
  if (!valid) log.error('ConfigValidator::validateTargets failed: invalid target inventory');
  return valid;
}
