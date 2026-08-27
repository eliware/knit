import { jest } from '@jest/globals';
// Tests for src/notifier/index.mjs
import * as notifier from '../../src/notifier/index.mjs';

const channelId = '123456789012345678';
const makeClient = send => ({ channels: { fetch: jest.fn().mockResolvedValue({ send }) } });

describe('notifier.mjs', () => {
  const log = { info: jest.fn(), error: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not send if channelId is missing', async () => {
    const sendMessageFn = jest.fn();
    await notifier.send({ channelId: '', post: {}, logOutput: '', hasError: false, log, discordClient: makeClient(sendMessageFn) });
    expect(sendMessageFn).not.toHaveBeenCalled();
  });

  it('should reject when the shared Discord client is not connected', async () => {
    notifier.clearDiscordClient();
    await expect(notifier.send({ channelId, post: {} })).rejects.toThrow('Discord client is not connected');
  });

  it('should clear only the registered Discord client', () => {
    const client = makeClient(jest.fn());
    const otherClient = makeClient(jest.fn());
    notifier.setDiscordClient(client);
    notifier.clearDiscordClient(otherClient);
    notifier.clearDiscordClient(client);
    notifier.clearDiscordClient();
  });

  it('should send error embed if hasError is true', async () => {
    const post = { ref: 'refs/tags/v1.0.0', repository: { full_name: 'foo/bar', html_url: 'url' }, pusher: { name: 'bob' } };
    const sendMessageFn = jest.fn();
    await notifier.send({ channelId, post, logOutput: '', hasError: true, log, discordClient: makeClient(sendMessageFn) });
    expect(sendMessageFn).toHaveBeenCalled();
  });

  it('should send success embed if hasError is false', async () => {
    const post = { ref: 'refs/tags/v1.0.0', repository: { full_name: 'foo/bar', html_url: 'url' }, pusher: { name: 'bob' } };
    const sendMessageFn = jest.fn();
    await notifier.send({ channelId, post, logOutput: '', hasError: false, log, discordClient: makeClient(sendMessageFn) });
    expect(sendMessageFn).toHaveBeenCalled();
  });

  it('cross-posts v tag announcements when Discord returns a message', async () => {
    const crosspost = jest.fn().mockResolvedValue(undefined);
    const sendMessageFn = jest.fn().mockResolvedValue({ crosspost });
    await notifier.send({ channelId, post: { ref: 'refs/tags/v2.1.1', repository: { full_name: 'foo/bar' } }, log, discordClient: makeClient(sendMessageFn) });
    expect(crosspost).toHaveBeenCalled();
  });

  it('resolves a repository channel when no channel ID is supplied', async () => {
    const channel = { send: jest.fn().mockResolvedValue(undefined) };
    const client = { channels: { fetch: jest.fn().mockResolvedValue(channel) } };
    notifier.setChannelResolver(jest.fn().mockResolvedValue(channelId));
    await notifier.send({ post: { repository: { full_name: 'foo/bar' } }, log, discordClient: client });
    expect(client.channels.fetch).toHaveBeenCalledWith(channelId);
    notifier.clearDiscordClient();
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


  it('truncates long push descriptions', async () => {
    const embed = await notifier.createEmbed({
      post: { ref: 'refs/heads/main', repository: {}, commits: Array.from({ length: 100 }, (_, i) => ({ id: String(i).repeat(10), message: 'x'.repeat(100), url: '' })) },
    });
    expect(embed.description.length).toBeLessThanOrEqual(1800);
    expect(embed.description).toContain('...');
  });

  it('uses repository owner avatar for tag fallback', async () => {
    const embed = await notifier.createEmbed({
      post: { ref: 'refs/tags/v1', repository: { full_name: 'o/r', owner: { avatar_url: 'owner.png' } } },
    });
    expect(embed.author.icon_url).toBe('owner.png');
  });

});

  it('send uses provided embed, defaults event, and sends to the channel', async () => {
    const embed = { title: 'Deployment' };
    const log = { info: jest.fn(), error: jest.fn() };
    const sendMessageFn = jest.fn();
    const discordClient = makeClient(sendMessageFn);
    await notifier.send({ channelId, post: {}, embed, hasError: false, log, discordClient });
    expect(log.info).toHaveBeenCalledWith('[Notifier] Sending message to Discord channel', { channelId });
    expect(sendMessageFn).toHaveBeenCalledWith({ embeds: [{ title: '✅ Deployment' }] });
  });

  it('send prefixes provided error embeds and awaits sender', async () => {
    const embed = { title: 'Failure' };
    const log = { info: jest.fn(), error: jest.fn() };
    const sendMessageFn = jest.fn(() => Promise.resolve());
    await notifier.send({ channelId, post: {}, embed, hasError: true, log, discordClient: makeClient(sendMessageFn) });
    expect(embed).toEqual({ title: 'Failure' });
  });


  it('does not mutate provided embeds', async () => {
    const embed = { title: 'Deployment', fields: [{ name: 'log', value: 'ok' }] };
    const sendMessageFn = jest.fn();
    await notifier.send({ channelId, post: { repository: { full_name: 'foo/bar' } }, embed, hasError: false, log: { info: jest.fn() }, discordClient: makeClient(sendMessageFn) });
    expect(embed).toEqual({ title: 'Deployment', fields: [{ name: 'log', value: 'ok' }] });
    expect(sendMessageFn).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
  });

  it('logs and rethrows Discord send failures with context', async () => {
    const error = new Error('discord down');
    const log = { info: jest.fn(), error: jest.fn() };
    await expect(notifier.send({ channelId, post: { repository: { full_name: 'foo/bar' } }, log, discordClient: makeClient(jest.fn().mockRejectedValue(error)) })).rejects.toBe(error);
    expect(log.error).toHaveBeenCalledWith('[Notifier] Discord channel send failed', { error, event: 'push', channelId, repository: 'foo/bar' });
  });

  it.each([
    ['a missing channel', undefined],
    ['a non-sendable channel', {}],
  ])('rejects when Discord returns %s', async (_label, channel) => {
    const log = { info: jest.fn(), error: jest.fn() };
    const discordClient = { channels: { fetch: jest.fn().mockResolvedValue(channel) } };
    await expect(notifier.send({ channelId, post: {}, log, discordClient })).rejects.toThrow(`Discord channel is not sendable: ${channelId}`);
    expect(log.error).toHaveBeenCalled();
  });

  it('builds tag embed with fallback repository data and no author extras', async () => {
    const embed = await notifier.createEmbed({ post: { ref: 'refs/tags/v1', repository: {} } });
    expect(embed).toMatchObject({ title: 'Unknown Repository v1 has been released! 🎉', url: 'https://github.com/Unknown Repository/releases/tag/v1', author: { name: 'unknown' } });
    expect(embed.author).not.toHaveProperty('icon_url');
    expect(embed.author).not.toHaveProperty('url');
  });

  it('builds push embed with sender avatar and handles absent change arrays', async () => {
    const embed = await notifier.createEmbed({
      post: {
        commits: [{ id: '123', message: '', url: '', added: 'bad', removed: [], modified: ['same'] }, { added: ['same'] }],
        head_commit: { added: 'bad', removed: 'bad', modified: 'bad' },
        sender: { avatar_url: 'sender.png' },
        repository: { full_name: 'r/r', owner: {} },
        pusher: {},
      },
      event: 'pull_request',
    });
    expect(embed.author).toEqual({ name: 'unknown', icon_url: 'sender.png' });
    expect(embed.fields).toEqual([{ name: 'Modified (1)', value: 'same', inline: false }]);
    expect(embed.description).toContain('**123**: []()');
  });

  it('builds generic embeds for missing event, push event, and defaults', async () => {
    await expect(notifier.createEmbed({ post: {} })).resolves.toMatchObject({
      title: 'Unknown Repository - Event',
      description: 'See details on GitHub for more information.',
    });
    await expect(notifier.createEmbed({ post: { action: 'closed' }, event: 'push' })).resolves.toMatchObject({
      title: 'Unknown Repository - closed',
    });
    await expect(notifier.createEmbed({ post: {}, event: 'issues' })).resolves.toMatchObject({
      title: 'Unknown Repository - issues',
    });
  });

  it('adds generic error output without altering the short description', async () => {
    const embed = await notifier.createEmbed({ post: {}, event: null, hasError: true, logOutput: 'failure' });
    expect(embed.description).toBe('See details on GitHub for more information.```text\nfailure\n```');
  });

it('covers send parameter defaults on an early return', async () => {
  await notifier.send({ channelId: '', post: {} });
});

it('uses repository URL when a tag name is empty', async () => {
  const embed = await notifier.createEmbed({
    post: { ref: 'refs/tags/', repository: { full_name: 'o/r', html_url: 'repo-url' } },
  });
  expect(embed.url).toBe('repo-url');
});

it('handles truthy non-array commits and generic events without actions', async () => {
  const push = await notifier.createEmbed({ post: { commits: 'x', repository: {} } });
  expect(push.description).toContain('Branch: **unknown** - Commits: **1**');

  const generic = await notifier.createEmbed({ post: {}, event: 'issues' });
  expect(generic.title).toBe('Unknown Repository - issues');

  const actionEvent = await notifier.createEmbed({ post: { action: 'opened' }, event: 'issues' });
  expect(actionEvent.title).toBe('Unknown Repository - issues: opened');
});

describe('Discord embed size limits', () => {
  it('keeps the tail of oversized logs and stays within description limit', async () => {
    const log = `${'old line\n'.repeat(1000)}FINAL ERROR LINE`;
    const embed = await notifier.createEmbed({ post: {}, event: 'push', hasError: true, logOutput: log });
    expect(embed.description.length).toBeLessThanOrEqual(4096);
    expect(embed.description).toContain('FINAL ERROR LINE');
    expect(embed.description).toContain('truncated; showing log tail');
  });

  it('handles tail helper edge cases and limits field count and values', () => {
    expect(notifier.tail('short', 20)).toBe('short');
    expect(notifier.tail('abcdef', 2)).toBe('ef');
    const embed = notifier.limitEmbed({
      title: 'x',
      description: 'short',
      fields: Array.from({ length: 30 }, () => ({ name: 'n'.repeat(300), value: 'v'.repeat(2000) }))
    });
    expect(embed.fields).toHaveLength(25);
    expect(embed.fields.every(field => field.value.length <= 1024 && field.name.length <= 256)).toBe(true);
  });

  it('limits the full embed text budget', () => {
    const embed = notifier.limitEmbed({ title: 't'.repeat(256), description: 'tail-marker-' + 'x'.repeat(7000), footer: { text: 'f'.repeat(2048) } });
    const total = embed.title.length + embed.description.length + embed.footer.text.length;
    expect(total).toBeLessThanOrEqual(6000);
    expect(embed.description).toContain('xxxxxxxx');
  });
});

test('covers empty and null values in embed limit helpers', () => {
  expect(notifier.tail(null, 10)).toBe('');
  const embed = notifier.limitEmbed({ fields: [{ name: '', value: '' }] });
  expect(embed.fields).toEqual([{ name: '', value: '' }]);
});

it('defaults an omitted post when creating an embed', async () => {
  await expect(notifier.createEmbed({ post: undefined })).resolves.toMatchObject({
    title: 'Unknown Repository - Event',
  });
});
