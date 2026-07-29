import { jest } from '@jest/globals';
import { consume } from '../src/consumer.mjs';

describe('consumer.mjs', () => {
  const log = { error: jest.fn(), info: jest.fn() };
  let Repo;
  let GitHub;
  beforeEach(() => {
    jest.clearAllMocks();
    Repo = { get: jest.fn() };
    GitHub = { validate: jest.fn() };
  });

  it('should return false if GitHub validation fails', async () => {
    GitHub.validate.mockReturnValue(false);
    const result = await consume({ message: { parsed: {} }, log, Repo, GitHub });
    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Consumer] GitHub validation failed');
  });

  it('should return false if repo not found', async () => {
    GitHub.validate.mockReturnValue(true);
    Repo.get.mockResolvedValue(null);
    const result = await consume({ message: { parsed: { repository: { full_name: 'foo' } } }, log, Repo, GitHub });
    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Consumer] Repo not found:', 'foo');
  });

  it('should return false if repo update fails', async () => {
    GitHub.validate.mockReturnValue(true);
    Repo.get.mockResolvedValue({ update: jest.fn().mockResolvedValue(false) });
    const result = await consume({ message: { parsed: { repository: { full_name: 'foo' } } }, log, Repo, GitHub });
    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalledWith('[Consumer] Repo update failed');
  });

  it('should return true if repo update succeeds', async () => {
    GitHub.validate.mockReturnValue(true);
    Repo.get.mockResolvedValue({ update: jest.fn().mockResolvedValue(true) });
    const result = await consume({ message: { parsed: { repository: { full_name: 'foo' } } }, log, Repo, GitHub });
    expect(result).toBe(true);
    expect(log.info).toHaveBeenCalledWith('[Consumer] Repo updated successfully');
  });
});
