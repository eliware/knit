import { log as logger } from '@eliware/common';
import * as ConfigValidator from './configValidator.mjs';
import { sshExec as realSshExec } from '@eliware/ssh-client';
import { loadWorkflow } from './workflowLoader.mjs';
import { defaultTargetLoader } from './targetLoader.mjs';
import * as Notifier from './notifier/index.mjs';
import { createWebhookEnvironment, withWebhookEnvironment } from './webhookEnvironment.mjs';

export function createSshRepo({ config, targets, packageJson, sshExec: injectedSshExec, log = logger, sendNotification } = {}) {
  const sshExec = injectedSshExec || realSshExec;
  const stopOnError = config.stopOnError ?? true;
  const notifyFn = sendNotification;
  return { targets: config.deployments, async update({ body, event = 'push', deliveryId = null, log: requestLog = log }) {
    if (!body || !Array.isArray(body.commits)) { requestLog.error('[Repo] body validation failed'); return false; }
    if (body.ref?.startsWith('refs/tags/')) {
      if (notifyFn) await notifyFn({ repo: this, body, event, logOutput: '', hasError: false, log: requestLog });
      else await Notifier.send({ post: body, packageJson, event, logOutput: '', hasError: false, log: requestLog });
      return true;
    }
    let output = ''; let failed = false;
    for (const deployment of config.deployments) {
      const target = targets[deployment.target];
      if (!target) throw new Error(`Unknown deployment target: ${deployment.target}`);
      const root = target.allowedCwdRoot?.replace(/\/+$/, '') || '';
      if (root && !(deployment.cwd === root || root === '' || deployment.cwd.startsWith(`${root}/`))) throw new Error(`Deployment cwd is outside target root: ${deployment.target}`);
      try {
        const environment = createWebhookEnvironment({ body, event, deliveryId });
        const results = await sshExec({ host: target.host, username: target.user, commands: deployment.commands.map(command => withWebhookEnvironment(command, environment)), cwd: deployment.cwd, privateKeyPath: target.identity, knownHostsPath: target.knownHosts, hostCaPath: target.hostCa, env: environment, commandTimeout: deployment.timeoutMs });
        for (const result of results) {
          output += formatCommandOutput({ cmd: result.command, stdout: result.result, stderr: '', exitCode: result.code });
          if (result.code !== 0) { requestLog.error(`[Repo] SSH command failed: ${result.command}`, result); failed = true; break; }
        }
      } catch (error) {
        output += formatCommandOutput({ cmd: deployment.commands.at(-1), stdout: error.stdout, stderr: error.stderr, exitCode: error.code || 1 });
        requestLog.error('[Repo] SSH connection failed', error); failed = true;
      }
      if (failed && stopOnError) break;
    }
    await notifyFn?.({ repo: this, body, logOutput: output, hasError: failed, log: requestLog });
    if (!notifyFn) await Notifier.send({ post: body, packageJson, event, logOutput: output, hasError: failed, log: requestLog });
    return !failed;
  } };
}

export async function get({ name, body, event = 'push', log = logger, targetLoader = defaultTargetLoader, workflowLoader = loadWorkflow } = {}) {
  try {
    const targets = targetLoader.load();
    if (event !== 'push') return createSshRepo({ config: { deployments: [] }, targets: targets.targets || {}, log });
    const commit = body?.after;
    const { workflow, packageJson } = await workflowLoader({ repository: name, commit });
    if (!ConfigValidator.validateWorkflow({ config: workflow, log })) throw new Error('Invalid repository workflow');
    const action = ConfigValidator.selectWorkflowAction({ config: workflow, post: body });
    if (!action) return null;
    for (const deployment of action.deployments) {
      const target = targets.targets?.[deployment.target];
      if (!target) throw new Error(`Unknown deployment target: ${deployment.target}`);
      if (target.allowedRepositories && !target.allowedRepositories.includes(name)) throw new Error(`Repository is not authorized for target: ${deployment.target}`);
    }
    return createSshRepo({ config: { ...action, stopOnError: action.stopOnError }, targets: targets.targets, packageJson, log });
  } catch (error) {
    log.error?.('[Repo] Workflow load failed', { name, error: error.message });
    return null;
  }
}

function formatCommandOutput({ cmd, stdout, stderr, exitCode }) {
  const statusSymbol = exitCode === 0 ? '✅ ' : '❌ ';
  let output = statusSymbol + cmd + '\n';
  if (stdout) output += stdout.trim() + '\n';
  if (stderr) output += 'ERRORS: \n' + stderr.trim() + '\n';
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}
