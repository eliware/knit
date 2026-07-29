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
});
