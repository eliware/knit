import { log as logger } from '@eliware/common';
import * as ConfigValidator from './configValidator.mjs';
import { defaultLoader } from './configLoader.mjs';
import { sshExec as realSshExec } from '@eliware/ssh-client';
import path from 'node:path';
import * as Notifier from './notifier.mjs';

export function createSshRepo({ config, sshExec: injectedSshExec, log = logger, sendNotification, configPath = process.env.KNIT_CONFIG_PATH || path.resolve('repos') } = {}) {
  const sshExec = injectedSshExec || realSshExec;
  const discordChannelId = config.discordChannelId || null;
  const notifyFn = sendNotification || (args => discordChannelId ? Notifier.send({ channelId: discordChannelId, post: args.body, ...args }) : undefined);
  const execution = config.execution || { stopOnError: true };
  const resolveRef = ref => !ref || ref === 'host-installed' ? undefined : path.isAbsolute(ref) ? ref : path.join(configPath, ref);
  const run = target => sshExec({ host: target.host, username: target.user, commands: target.commands, cwd: target.workingDirectory, privateKeyPath: resolveRef(target.identity), knownHostsPath: resolveRef(target.knownHosts), hostCaPath: resolveRef(target.hostCa) });
  return { discordChannelId, targets: config.targets, async update({ body, log: requestLog = log }) {
    if (!body || !Array.isArray(body.commits)) { requestLog.error('[Repo] body validation failed'); return false; }
    if (body.ref?.startsWith('refs/tags/')) { await notifyFn?.({ repo: this, body, logOutput: '', hasError: false, log: requestLog }); return true; }
    let output = ''; let failed = false;
    for (const target of config.targets) {
      try {
        const results = await run(target);
        for (const result of results) {
          output += formatCommandOutput({ cmd: result.command, stdout: result.result, stderr: '', exitCode: result.code });
          if (result.code !== 0) { requestLog.error(`[Repo] SSH command failed: ${result.command}`, result); failed = true; break; }
        }
      } catch (error) {
        output += formatCommandOutput({ cmd: target.commands.at(-1), stdout: error.stdout, stderr: error.stderr, exitCode: error.code || 1 });
        requestLog.error('[Repo] SSH connection failed', error); failed = true;
      }
      if (failed && execution.stopOnError) break;
    }
    await notifyFn?.({ repo: this, body, logOutput: output, hasError: failed, log: requestLog });
    return !failed;
  } };
}

export async function get({ name, log = logger, loader = defaultLoader, loaderOptions } = {}) {
  const config = await (loaderOptions ? loaderOptions.load(name) : loader.load(name));
  if (!config || !ConfigValidator.validate({ config, log })) return null;
  return createSshRepo({ config, log, ...loaderOptions });
}

function formatCommandOutput({ cmd, stdout, stderr, exitCode }) {
  const statusSymbol = exitCode === 0 ? '✅ ' : '❌ ';
  let output = statusSymbol + cmd + '\n';
  if (stdout) output += stdout.trim() + '\n';
  if (stderr) output += 'ERRORS: \n' + stderr.trim() + '\n';
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}
