import { fs as defaultFs, resolvePath as defaultPath, log as logger } from '@eliware/common';
import inquirer from 'inquirer';
import { encrypt, isEncryptionConfigured } from './crypto.mjs';

/**
 * Interactive setup wizard for repository configuration.
 */
export async function runWizard({ log = logger, getCommands: getCommandsFn = getCommands, fs = defaultFs, path = defaultPath, crypto = { encrypt, isEncryptionConfigured } } = {}) {
    try {
        log.info('Starting interactive setup wizard');
        const { repoName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'repoName',
                message: 'Repository Name (owner/repo):',
                validate: input => /^.+\/.+$/.test(input) || 'Invalid repository name format. Use owner/repo.'
            }
        ]);
        const [owner, repo] = repoName.split('/');
        const { targetHost } = await inquirer.prompt([
            { type: 'input', name: 'targetHost', message: 'Target host:', default: process.env.KNIT_DEFAULT_TARGET_HOST || 'dev.purinton.us', validate: input => Boolean(input) || 'Target host cannot be empty.' }
        ]);
        const { installPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'installPath',
                message: 'Install Path:',
                validate: input => Boolean(input) || 'Install path cannot be empty.'
            }
        ]);
        const preCommands = await getCommandsFn('pre-deployment');
        let postCommands = [];
        // npm install (default yes)
        const { runNpm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'runNpm',
                message: 'Do you want to run npm install?',
                default: true
            }
        ]);
        if (runNpm) {
            postCommands.push('npm install --silent');
            // npm test (default yes)
            const { runNpmTest } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'runNpmTest',
                    message: 'Do you want to run npm test?',
                    default: true
                }
            ]);
            if (runNpmTest) {
                postCommands.push('npm test > .jest.result 2>&1');
            }
        }
        postCommands = postCommands.concat(await getCommandsFn('post-deployment'));
        const { user } = await inquirer.prompt([
            {
                type: 'input',
                name: 'user',
                message: 'User:',
                default: 'root'
            }
        ]);
        // Remove default webhook URL
        const { notify } = await inquirer.prompt([
            {
                type: 'input',
                name: 'notify',
                message: 'Notification URL:'
            }
        ]);
        const config = buildConfig(owner, repo, targetHost, installPath, preCommands, user, postCommands, notify);
        const jsonConfig = JSON.stringify(config, null, 2);
        const filePath = await saveConfigurationFile(owner, repo, jsonConfig, fs, path, crypto);
        printRepositoryInfo(filePath, log);
        log.info('Repository configuration complete');
    } catch (err) {
        log.error('Wizard error:', err);
    }
}

export async function getCommands(type) {
    const commands = [];
    const { hasCommand } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'hasCommand',
            message: `Do you have any ${type} commands?`,
            default: false
        }
    ]);
    if (!hasCommand) return commands;
    let addMore = true;
    while (addMore) {
        const { cmd } = await inquirer.prompt([
            {
                type: 'input',
                name: 'cmd',
                message: `Enter a ${type} command:`,
                validate: input => !!input || 'Command cannot be empty.'
            }
        ]);
        commands.push(cmd);
        const { more } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'more',
                message: `Do you have another ${type} command?`,
                default: false
            }
        ]);
        addMore = more;
    }
    return commands;
}

function buildConfig(owner, repo, host, workingDirectory, pre, user, post, notify) {
    return {
        repository: `${owner}/${repo}`,
        git: { url: `git@github.com:${owner}/${repo}.git`, ref: 'main', credential: 'host-installed' },
        targets: [{
            name: host.split('.')[0],
            host,
            user,
            identity: 'host-installed',
            knownHosts: `${owner}/ssh/known_hosts`,
            workingDirectory,
            pre: pre.filter(command => command !== 'git pull --ff-only'),
            post
        }],
        execution: { mode: 'sequential', stopOnError: true },
        notify
    };
}

export async function saveConfigurationFile(owner, repo, jsonConfig, fs = defaultFs, path = defaultPath, crypto = { encrypt, isEncryptionConfigured }) {
    if (!crypto.isEncryptionConfigured()) throw new Error('Knit config encryption is required');
    const plaintextRoot = process.env.KNIT_CONFIG_PLAINTEXT_PATH || '/root/.config/knit-configs/plaintext';
    const encryptedRoot = process.env.KNIT_CONFIG_REPO_PATH || path(import.meta, '..', 'repos');
    const plaintextDir = path(plaintextRoot, owner);
    const encryptedDir = path(encryptedRoot, owner);
    for (const dir of [plaintextDir, encryptedDir]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    const plaintextPath = path(plaintextDir, `${repo}.json`);
    const encryptedPath = path(encryptedDir, `${repo}.json.age`);
    fs.writeFileSync(plaintextPath, jsonConfig, { mode: 0o600 });
    fs.writeFileSync(encryptedPath, await crypto.encrypt(jsonConfig), { mode: 0o600 });
    return encryptedPath;
}

function printRepositoryInfo(filePath, log) {
    log.info(`Repository configuration saved to ${filePath}`);
    log.info('Reminder: Set the GitHub webhook!', { url: 'https://knit.eliware.org', post: 'application/json' });
}

