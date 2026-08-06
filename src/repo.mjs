import { fs, path, log as logger } from '@eliware/common';
import { exec } from 'child_process';
import * as ConfigValidator from './configValidator.mjs';
import * as Notifier from './notifier.mjs';

/**
 * Creates a repository handler for update operations.
 * @param {Object} params
 * @param {Object} params.config - The repository configuration object.
 * @param {Function} [params.sendNotification] - Optional sendNotification for testing/mocking.
 * @returns {Object} The repository handler with an update method.
 */
export function createRepo({ config, execCommandFn = execCommand, sendNotification } = {}) {
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
    notify: config.notify || null,
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
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
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
export async function get({ name, log = logger }) {
  const configFile = path(import.meta, '..', 'repos', `${name}.json`);
  if (!fs.existsSync(configFile)) {
    return null;
  }
  let config;
  try {
    config = ConfigValidator.validateJsonFile({ path: configFile });
  } catch {
    return null;
  }
  if (!ConfigValidator.validate({ config })) {
    return null;
  }
  return createRepo({ config, log });
}
