import { execFile as realExecFile } from "child_process";
import { log as logger } from "@eliware/common";

/**
 * Stages a file for commit using git add.
 * @param {Object} params
 * @param {string} params.filePath - The file path to add.
 * @param {Object} [params.log] - Logger instance to use.
 * @returns {Promise<string>} The stdout from git add.
 */
function add({ filePath, log = logger, execFile = realExecFile }) {
  return new Promise((resolve, reject) => {
    execFile("git", ["add", "--", filePath], (error, stdout, stderr) => {
      if (error) {
        log.error(`git add error: ${stderr}`);
        reject(new Error(`git add error: ${stderr}`));
      } else {
        log.info(`git add success: ${filePath}`);
        resolve(stdout);
      }
    });
  });
}
function commit({ message, log = logger, execFile = realExecFile }) {
  return new Promise((resolve, reject) => {
    execFile("git", ["commit", "--quiet", "-m", message], (error, stdout, stderr) => {
      if (error) {
        log.error(`git commit error: ${stderr}`);
        reject(new Error(`git commit error: ${stderr}`));
      } else {
        log.info("git commit success");
        resolve(stdout);
      }
    });
  });
}
function push({ execFile = realExecFile } = {}) {
  return new Promise((resolve, reject) => {
    execFile("git", ["push", "--quiet"], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`git push error: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}
export default add;
Object.assign(add, {
  add,
  commit,
  push,
});
