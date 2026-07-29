import { fs as defaultFs, path as defaultPath, log as logger } from '@eliware/common';
import inquirer from 'inquirer';

/**
 * Interactive setup wizard for repository configuration.
 */
export async function runWizard({ log = logger, getCommands: getCommandsFn = getCommands, fs = defaultFs, path = defaultPath } = {}) {
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
        const { group } = await inquirer.prompt([
            {
                type: 'input',
                name: 'group',
                message: 'Group:',
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
        const config = buildConfig(installPath, preCommands, user, group, postCommands, notify);
        const jsonConfig = JSON.stringify(config, null, 2);
        const filePath = await saveConfigurationFile(owner, repo, jsonConfig, fs, path);
        printRepositoryInfo(filePath);
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

function buildConfig(installPath, pre, user, group, post, notify) {
    return {
        pwd: installPath,
        pre,
        user,
        group,
        post,
        notify
    };
}

async function saveConfigurationFile(owner, repo, jsonConfig, fs = defaultFs, path = defaultPath) {
    const dirPath = path(import.meta, '..', 'repos', owner);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path(dirPath, `${repo}.json`);
    fs.writeFileSync(filePath, jsonConfig);
    return filePath;
}

function printRepositoryInfo(filePath) {
    console.log(`Repository configuration saved to ${filePath}`);
    console.log('\nReminder: Set the GitHub webhook!\nURL to https://knit.eliware.org\nPOST: application/json\n');
}

