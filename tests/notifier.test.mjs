import { jest } from '@jest/globals';
// Tests for src/notifier.mjs
import * as notifier from '../src/notifier.mjs';

describe('notifier.mjs', () => {
  const log = { info: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not send if notifyUrl is missing', async () => {
    const sendMessageFn = jest.fn();
    await notifier.send({ notifyUrl: '', post: {}, logOutput: '', hasError: false, log, sendMessageFn });
    expect(sendMessageFn).not.toHaveBeenCalled();
  });

  it('should send error embed if hasError is true', async () => {
    const post = { ref: 'refs/tags/v1.0.0', repository: { full_name: 'foo/bar', html_url: 'url' }, pusher: { name: 'bob' } };
    const sendMessageFn = jest.fn();
    await notifier.send({ notifyUrl: 'url', post, logOutput: '', hasError: true, log, sendMessageFn });
    expect(sendMessageFn).toHaveBeenCalled();
  });

  it('should send success embed if hasError is false', async () => {
    const post = { ref: 'refs/tags/v1.0.0', repository: { full_name: 'foo/bar', html_url: 'url' }, pusher: { name: 'bob' } };
    const sendMessageFn = jest.fn();
    await notifier.send({ notifyUrl: 'url', post, logOutput: '', hasError: false, log, sendMessageFn });
    expect(sendMessageFn).toHaveBeenCalled();
  });

  it('createEmbed: should return an embed for tag', async () => {
    const post = { ref: 'refs/tags/v1.0.0', repository: { full_name: 'foo/bar', html_url: 'url' }, pusher: { name: 'bob' } };
    const embed = await notifier.createEmbed({ post, logOutput: '', hasError: false });
    expect(embed.title).toMatch(/has been released/);
    expect(embed.url).toContain('releases/tag');
  });

  it('createEmbed: should build push embed with file changes and log output', async () => {
    const embed = await notifier.createEmbed({
      post: {
        ref: 'refs/heads/main',
        repository: { full_name: 'foo/bar', html_url: 'url', owner: { avatar_url: 'owner.png' } },
        pusher: { name: 'bob' },
        commits: [{ id: '123456789', message: 'change', url: 'commit', added: ['a'], removed: ['b'], modified: ['c'] }],
        head_commit: { timestamp: '2025-01-01T00:00:00Z', added: ['c'], removed: ['d'], modified: ['e'] },
      },
      logOutput: 'failure',
      hasError: true,
    });
    expect(embed.title).toBe('New Commits Pushed to foo/bar');
    expect(embed.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'New (1)', value: 'a' }),
      expect.objectContaining({ name: 'Deleted (2)', value: 'b\nd' }),
      expect.objectContaining({ name: 'Modified (2)', value: 'c\ne' }),
    ]));
    expect(embed.author).toEqual({ name: 'bob', icon_url: 'owner.png', url: 'https://github.com/bob' });
    expect(embed.description).toContain('failure');
  });

  it('createEmbed: should build generic event embed', async () => {
    const embed = await notifier.createEmbed({
      post: { action: 'opened', repository: { full_name: 'foo/bar' } },
      logOutput: 'details',
      hasError: true,
    });
    expect(embed.title).toBe('foo/bar - opened');
    expect(embed.description).toContain('details');
    expect(embed.footer.text).toBe('GitHub Event');
  });

  it('createEmbed: should use sender avatar and unknown defaults', async () => {
    const embed = await notifier.createEmbed({
      post: { ref: 'refs/tags/v1 beta', repository: {}, sender: { avatar_url: 'sender.png' } },
    });
    expect(embed.author).toEqual({ name: 'unknown', icon_url: 'sender.png' });
    expect(embed.url).toContain('v1%20beta');
  });

});
