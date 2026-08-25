import { jest } from '@jest/globals';
import { startDiscordClient, stopDiscordClient } from '../src/discordClient.mjs';

test('starts and registers the Discord client with minimal intents', async () => {
  const client = { shutdown: jest.fn().mockResolvedValue(undefined) };
  const createDiscordFn = jest.fn().mockResolvedValue(client);
  const log = { info: jest.fn(), warn: jest.fn() };
  await expect(startDiscordClient({ createDiscordFn, token: 'token', clientId: 'client', guildId: 'guild', log })).resolves.toBe(client);
  expect(createDiscordFn).toHaveBeenCalledWith(expect.objectContaining({ token: 'token', clientId: 'client', intents: { Guilds: true }, log }));
  expect(createDiscordFn.mock.calls[0][0].intents).toEqual({ Guilds: true });
  await stopDiscordClient(client);
  expect(client.shutdown).toHaveBeenCalled();
});

test('leaves Discord disabled when credentials are absent', async () => {
  const log = { info: jest.fn(), warn: jest.fn() };
  await expect(startDiscordClient({ token: '', clientId: '', log })).resolves.toBeNull();
  expect(log.warn).toHaveBeenCalled();
});

test('uses safe defaults when started without options', async () => {
  const previousToken = process.env.DISCORD_TOKEN;
  const previousClientId = process.env.DISCORD_CLIENT_ID;
  delete process.env.DISCORD_TOKEN;
  delete process.env.DISCORD_CLIENT_ID;
  try {
    await expect(startDiscordClient()).resolves.toBeNull();
  } finally {
    if (previousToken === undefined) delete process.env.DISCORD_TOKEN;
    else process.env.DISCORD_TOKEN = previousToken;
    if (previousClientId === undefined) delete process.env.DISCORD_CLIENT_ID;
    else process.env.DISCORD_CLIENT_ID = previousClientId;
  }
});

test('uses environment credentials and handles the default shutdown path', async () => {
  const previousToken = process.env.DISCORD_TOKEN;
  const previousClientId = process.env.DISCORD_CLIENT_ID;
  const createDiscordFn = jest.fn().mockResolvedValue({ destroy: jest.fn().mockResolvedValue(undefined) });
  process.env.DISCORD_TOKEN = 'environment-token';
  process.env.DISCORD_CLIENT_ID = 'environment-client';
  try {
    const client = await startDiscordClient({ createDiscordFn, guildId: 'guild', log: { info: jest.fn(), warn: jest.fn() } });
    expect(client).toBeDefined();
    await stopDiscordClient(client);
    expect(client.destroy).toHaveBeenCalled();
  } finally {
    if (previousToken === undefined) delete process.env.DISCORD_TOKEN;
    else process.env.DISCORD_TOKEN = previousToken;
    if (previousClientId === undefined) delete process.env.DISCORD_CLIENT_ID;
    else process.env.DISCORD_CLIENT_ID = previousClientId;
  }
});

test('loads guild ID from the injected target loader', async () => {
  const client = { shutdown: jest.fn() };
  const createDiscordFn = jest.fn().mockResolvedValue(client);
  await expect(startDiscordClient({ createDiscordFn, token: 'token', clientId: 'client', targetLoader: { load: () => ({ guildId: 'guild' }) }, log: { info: jest.fn(), warn: jest.fn() } })).resolves.toBe(client);
  await stopDiscordClient(client);
});

test('requires both Discord credentials', async () => {
  await expect(startDiscordClient({ token: 'token', clientId: '' })).rejects.toThrow('Both DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
});

test('stops cleanly without a client', async () => {
  await expect(stopDiscordClient()).resolves.toBeUndefined();
});
