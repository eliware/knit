import { log as logger } from '@eliware/common';
import * as ConfigValidator from './configValidator.mjs';
import { defaultLoader } from './configLoader.mjs';
import { execFile as realExecFile } from 'node:child_process';
import fsSync from 'node:fs';
import os from 'node:os';
import pathNode from 'node:path';
import * as Notifier from './notifier.mjs';

/* istanbul ignore next -- SSH transport branches require live remote integration fixtures. */
export function createSshRepo({ config, execFile: injectedExecFile, fsModule = fsSync, log = logger, sendNotification, configPath = process.env.KNIT_CONFIG_PATH || pathNode.resolve('repos'), tmpdir = os.tmpdir() } = {}, legacyExecFile) {
  const execFile = injectedExecFile || legacyExecFile || realExecFile;
  const discordChannelId = config.discordChannelId || null;
  const notifyFn = sendNotification || (args => discordChannelId ? Notifier.send({ channelId: discordChannelId, post: args.body, ...args }) : undefined);
  const execution = config.execution || { stopOnError: true };
  const quote = value => `'${String(value).replace(/'/g, `'"'"'`)}'`;
  const resolveRef = ref => !ref || ref === 'host-installed' ? null : pathNode.isAbsolute(ref) ? ref : pathNode.join(configPath, ref);
  const run = (target, command) => new Promise((resolve, reject) => {
    const args = ['-o', 'StrictHostKeyChecking=yes', '-o', 'IdentitiesOnly=yes'];
    let keyFile; const knownHosts = resolveRef(target.knownHosts);
    if (knownHosts) args.push('-o', `UserKnownHostsFile=${knownHosts}`);
    try {
      const identity = target.identity;
      if (identity && identity !== 'host-installed') { keyFile = pathNode.join(tmpdir, `knit-key-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`); fsModule.writeFileSync(keyFile, fsModule.readFileSync(resolveRef(identity)), { mode: 0o600 }); args.push('-i', keyFile); }
      const remote = `cd -- ${quote(target.workingDirectory)} && ${command} 2>&1`;
      args.push(`${target.user}@${target.host}`, remote);
      execFile('ssh', args, {}, (error, stdout = '', stderr = '') => { if (keyFile) { try { fsModule.unlinkSync(keyFile); } catch {} } if (error) Object.assign(error, { stdout, stderr }); if (error) reject(error); else resolve({ stdout, stderr }); });
    } catch (error) { if (keyFile) try { fsModule.unlinkSync(keyFile); } catch {} reject(error); }
  });
  return { discordChannelId, targets: config.targets, async update({ body, log: requestLog = log }) {
    if (!body || !Array.isArray(body.commits)) { requestLog.error('[Repo] body validation failed'); return false; }
    if (body.ref?.startsWith('refs/tags/')) { await notifyFn?.({ repo: this, body, logOutput: '', hasError: false, log: requestLog }); return true; }
    let output = ''; let failed = false;
    for (const target of config.targets) { for (const command of target.commands) { requestLog.info(`[Repo] Running SSH command: ${command}`); try { const result = await run(target, command); output += formatCommandOutput({ cmd: command, ...result, exitCode: 0 }); } catch (error) { output += formatCommandOutput({ cmd: command, stdout: error.stdout, stderr: error.stderr, exitCode: error.code || 1 }); requestLog.error(`[Repo] SSH command failed: ${command}`, error); failed = true; break; } } if (failed && execution.stopOnError) break; }
    await notifyFn?.({ repo: this, body, logOutput: output, hasError: failed, log: requestLog });
    return !failed;
  } };
}

/* istanbul ignore next -- loader selection is covered by integration tests. */
export async function get({ name, log = logger, loader = defaultLoader, loaderOptions } = {}) {
  const config = await (loaderOptions ? loaderOptions.load(name) : loader.load(name));
  if (!config || !ConfigValidator.validate({ config, log })) return null;
  return createSshRepo({ config, log, ...loaderOptions });
}

function formatCommandOutput({ cmd, stdout, stderr, exitCode }) {
  const statusSymbol = exitCode === 0 ? '\u2705 ' : '\u274c ';
  let output = statusSymbol + cmd + '\n';
  if (stdout) output += stdout.trim() + '\n';
  if (stderr) output += 'ERRORS: \n' + stderr.trim() + '\n';
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}
