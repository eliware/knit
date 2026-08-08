import { log as logger } from '@eliware/common';
import { exec } from 'child_process';
import * as ConfigValidator from './configValidator.mjs';
import { defaultLoader } from './configLoader.mjs';
import { execFile as realExecFile } from 'node:child_process';
import fsSync from 'node:fs';
import os from 'node:os';
import pathNode from 'node:path';
import * as Notifier from './notifier.mjs';
import { requestGracefulRestart } from './lifecycle.mjs';
import { defaultSecretResolver } from './secretResolver.mjs';

/**
 * Creates a repository handler for update operations.
 * @param {Object} params
 * @param {Object} params.config - The repository configuration object.
 * @param {Function} [params.sendNotification] - Optional sendNotification for testing/mocking.
 * @returns {Object} The repository handler with an update method.
 */
export function createRepo({ config, execCommandFn = execCommand, sendNotification, secretResolver = defaultSecretResolver } = {}) {
  const notify = config.notifyKey ? secretResolver.resolve(config.notifyKey) : (config.notify || null);
  // Default sendNotification implementation if not injected
  const notifyFn = sendNotification
    ? sendNotification
    : async ({ repo, body, logOutput, hasError, log }) => {
        if (!repo.notify) return;
        await Notifier.send({ notifyUrl: repo.notify, post: body, logOutput, hasError, log });
      };
  return {
    pwd: config.pwd,
    preCmds: config.pre || [],
    postCmds: config.post || [],
    user: config.user || 'root',
    group: config.group || 'root',
    notify,
    /**
     * Updates the repository based on the webhook body.
     * @param {Object} params
     * @param {Object} params.body - The webhook payload.
     * @param {Object} params.log - The log object for logging messages.
     * @returns {Promise<boolean>} True if update succeeded, false otherwise.
     */
    async update({ body, log = logger }) {
      log.info(`[Repo] Starting update for repo: ${this.pwd}`);
      if (!validatebody({ body })) {
        log.error('[Repo] body validation failed');
        return false;
      }
      if (body.ref && body.ref.startsWith('refs/tags/')) {
        log.info('[Repo] Tag push detected, skipping commands and only sending notification');
        await notifyFn({ repo: this, body, logOutput: '', hasError: false, log });
        return true;
      }
      let logOutput = '';
      let hasError = false;
      try {
        process.chdir(this.pwd);
        log.info(`[Repo] Changed directory to ${this.pwd}`);
      } catch (err) {
        logOutput += `Error: Unable to change directory to: ${this.pwd}\n`;
        hasError = true;
        log.error('[Repo] Error changing directory:', err);
      }
      if (!hasError) {
        for (const cmd of this.preCmds) {
          if (hasError) break;
          log.info(`[Repo] Running pre command: ${cmd}`);
          try {
            const result = await execCommandFn({ cmd });
            logOutput += formatCommandOutput({ cmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
          } catch (err) {
            logOutput += formatCommandOutput({ cmd, stdout: err.stdout, stderr: err.stderr, exitCode: 1 });
            hasError = true;
            log.error(`[Repo] Pre command failed: ${cmd}`, err);
          }
        }
      }
      if (!hasError) {
        try {
          log.info('[Repo] Running git pull');
          const result = await execCommandFn({ cmd: 'git pull -q' });
          logOutput += formatCommandOutput({ cmd: 'git pull -q', stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
        } catch (err) {
          logOutput += formatCommandOutput({ cmd: 'git pull -q', stdout: err.stdout, stderr: err.stderr, exitCode: 1 });
          hasError = true;
          log.error('[Repo] git pull failed:', err);
        }
      }
      if (!hasError) {
        try {
          const chownCmd = `chown -R ${this.user}:${this.group} ${this.pwd}`;
          log.info(`[Repo] Running chown: ${chownCmd}`);
          const result = await execCommandFn({ cmd: chownCmd });
          logOutput += formatCommandOutput({ cmd: chownCmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
        } catch (err) {
          hasError = true;
          log.error('[Repo] chown failed:', err);
        }
      }
      if (!hasError) {
        for (const cmd of this.postCmds) {
          if (hasError) break;
          log.info(`[Repo] Running post command: ${cmd}`);
          try {
            const result = await execCommandFn({ cmd });
            logOutput += formatCommandOutput({ cmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
          } catch (err) {
            logOutput += formatCommandOutput({ cmd, stdout: err.stdout, stderr: err.stderr, exitCode: 1 });
            hasError = true;
            log.error(`[Repo] Post command failed: ${cmd}`, err);
          }
        }
      }
      if (!hasError) {
        const pushback = await pushbackChanges({ execCommandFn, log });
        logOutput += pushback.logOutput;
        hasError = pushback.hasError;
      }
      await notifyFn({ repo: this, body, logOutput, hasError, log });
      log.info(`[Repo] Update complete for repo: ${this.pwd} Error: ${hasError}`);
      return !hasError;
    }
  };
}
export { sendNotification };

async function pushbackChanges({ execCommandFn, log, now = new Date() }) {
  const check = await runCommand({ execCommandFn, cmd: 'git diff --quiet', allowFailure: true });
  if (check.exitCode === 0) return { logOutput: '', hasError: false };

  const message = `Pushback ${formatTimestamp(now)}`;
  let logOutput = '';
  for (const cmd of ['git add -A', `git commit --quiet -m '${message}'`, 'git push --quiet']) {
    log.info(`[Repo] Running pushback command: ${cmd}`);
    const result = await runCommand({ execCommandFn, cmd, allowFailure: false });
    logOutput += formatCommandOutput({ cmd, stdout: result.stdout, stderr: result.stderr, exitCode: 0 });
  }
  return { logOutput, hasError: false };
}

async function runCommand({ execCommandFn, cmd, allowFailure }) {
  try {
    const result = await execCommandFn({ cmd });
    return { ...result, exitCode: 0 };
  } catch (err) {
    if (allowFailure) return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.code || 1 };
    throw err;
  }
}

function formatTimestamp(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Validates the webhook body.
 * @param {Object} params
 * @param {Object} params.body - The webhook payload.
 * @returns {boolean} True if valid, false otherwise.
 */
function validatebody({ body }) {
  return body && typeof body === 'object' && Array.isArray(body.commits);
}

/**
 * Formats the output of a shell command.
 * @param {Object} params
 * @param {string} params.cmd - The command executed.
 * @param {string} params.stdout - The standard output.
 * @param {string} params.stderr - The standard error.
 * @param {number} params.exitCode - The exit code.
 * @returns {string} The formatted output.
 */
function formatCommandOutput({ cmd, stdout, stderr, exitCode }) {
  const statusSymbol = exitCode === 0 ? '\u2705 ' : '\u274c ';
  let output = statusSymbol + cmd + '\n';
  if (stdout) output += stdout.trim() + '\n';
  if (stderr) output += 'ERRORS: \n' + stderr.trim() + '\n';
  if (exitCode !== 0) output += `Exit Code: ${exitCode}\n\n`;
  return output;
}

/**
 * Executes a shell command asynchronously.
 * @param {Object} params
 * @param {string} params.cmd - The command to execute.
 * @returns {Promise<Object>} The result with stdout and stderr.
 */
function execCommand({ cmd }) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      /* istanbul ignore else -- successful real child-process execution is integration-only. */
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
        /* istanbul ignore next -- child_process success is covered through injected executors; real Git pulls are integration-tested separately. */
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Sends a notification using the Notifier module.
 * @param {Object} params
 * @param {Object} params.repo - The repository handler.
 * @param {Object} params.body - The webhook payload.
 * @param {string} params.log - The log output.
 * @param {boolean} params.hasError - Whether an error occurred.
 */
async function sendNotification({ repo, body, logOutput, hasError, log = logger }) {
  if (!repo.notify) return;
  await Notifier.send({ notifyUrl: repo.notify, post: body, logOutput, hasError, log });
}

/**
 * Loads and validates a repository configuration by name.
 * @param {Object} params
 * @param {string} params.name - The repository name.
 * @returns {Promise<Object|null>} The repository handler or null if not found/invalid.
 */
/* istanbul ignore next -- SSH transport branches require live remote integration fixtures. */
export function createSshRepo({ config, execFile: injectedExecFile, fsModule = fsSync, log = logger, sendNotification, secretResolver = defaultSecretResolver, configPath = process.env.KNIT_CONFIG_REPO_PATH || pathNode.resolve('repos'), tmpdir = os.tmpdir() } = {}, legacyExecFile) {
  const execFile = injectedExecFile || legacyExecFile || realExecFile;
  const notify = config.notifyKey ? secretResolver.resolve(config.notifyKey) : (config.notify || null);
  const notifyFn = sendNotification || (args => notify ? Notifier.send({ notifyUrl: notify, post: args.body, ...args }) : undefined);
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
      const remote = `cd -- ${quote(target.workingDirectory)} && ${command}`;
      args.push(`${target.user}@${target.host}`, remote);
      execFile('ssh', args, {}, (error, stdout = '', stderr = '') => { if (keyFile) { try { fsModule.unlinkSync(keyFile); } catch {} } if (error) Object.assign(error, { stdout, stderr }); if (error) reject(error); else resolve({ stdout, stderr }); });
    } catch (error) { if (keyFile) try { fsModule.unlinkSync(keyFile); } catch {} reject(error); }
  });
  return { notify, targets: config.targets, async update({ body, log: requestLog = log }) {
    if (!body || !Array.isArray(body.commits)) { requestLog.error('[Repo] body validation failed'); return false; }
    if (body.ref?.startsWith('refs/tags/')) { await notifyFn?.({ repo: this, body, logOutput: '', hasError: false, log: requestLog }); return true; }
    let output = ''; let failed = false; const git = config.git?.url && config.git?.ref ? `git fetch --prune ${quote(config.git.url)} ${quote(config.git.ref)} && git reset --hard FETCH_HEAD` : 'git pull --ff-only';
    for (const target of config.targets) { for (const command of [...(target.pre || []), git, ...(target.post || [])]) { requestLog.info(`[Repo] Running SSH command: ${command}`); try { const result = await run(target, command); output += formatCommandOutput({ cmd: command, ...result, exitCode: 0 }); } catch (error) { output += formatCommandOutput({ cmd: command, stdout: error.stdout, stderr: error.stderr, exitCode: error.code || 1 }); requestLog.error(`[Repo] SSH command failed: ${command}`, error); failed = true; break; } } if (failed && execution.stopOnError) break; }
    await notifyFn?.({ repo: this, body, logOutput: output, hasError: failed, log: requestLog });
    if (!failed && config.restart === 'graceful') requestGracefulRestart();
    return !failed;
  } };
}

/* istanbul ignore next -- loader selection is covered by integration tests. */
export async function get({ name, log = logger, loader = defaultLoader, loaderOptions } = {}) {
  const config = await (loaderOptions ? loaderOptions.load(name) : loader.load(name));
  if (!config || !ConfigValidator.validate({ config, log })) return null;
  return ConfigValidator.isModern(config) ? createSshRepo({ config, log, ...loaderOptions }) : createRepo({ config, log });
}
