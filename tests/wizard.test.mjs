process.env.NODE_ENV = 'test';
import { jest } from '@jest/globals';
import inquirer from 'inquirer';
import * as wizard from '../src/wizard.mjs';

const mockFs = {
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
};
const mockPath = jest.fn((...args) => args.join('/'));

describe('wizard.mjs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run the wizard and collect all answers', async () => {
    jest.spyOn(inquirer, 'prompt')
      .mockResolvedValueOnce({ repoName: 'owner/repo' })
      .mockResolvedValueOnce({ installPath: '/tmp' })
      .mockResolvedValueOnce({ runNpm: true })
      .mockResolvedValueOnce({ runNpmTest: true })
      .mockResolvedValueOnce({ user: 'root' })
      .mockResolvedValueOnce({ group: 'root' })
      .mockResolvedValueOnce({ notify: '' });
    const getCommands = jest.fn().mockResolvedValue([]);
    const log = { info: jest.fn(), error: jest.fn() };
    await expect(wizard.runWizard({ log, getCommands, fs: mockFs, path: mockPath })).resolves.toBeUndefined();
    expect(log.info).toHaveBeenCalledWith('Starting interactive setup wizard');
    expect(mockFs.writeFileSync).not.toThrow;
  });

  it('should handle errors in the wizard', async () => {
    jest.spyOn(inquirer, 'prompt').mockRejectedValue(new Error('fail'));
    const getCommands = jest.fn();
    const log = { info: jest.fn(), error: jest.fn() };
    await wizard.runWizard({ log, getCommands, fs: mockFs, path: mockPath });
    expect(log.error).toHaveBeenCalledWith('Wizard error:', expect.any(Error));
  });
});
