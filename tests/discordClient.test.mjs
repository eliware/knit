import { jest } from '@jest/globals';
import { startDiscordClient, stopDiscordClient } from '../src/discordClient.mjs';

test('starts and registers the Discord client with minimal intents', async () => {
  const client = { shutdown: jest.fn().mockResolvedValue(undefined) };
  const createDiscordFn = jest.fn().mockResolvedValue(client);
  const log = { info: jest.fn(), warn: jest.fn() };
  await expect(startDiscordClient({ createDiscordFn, token: 'token', clientId: 'client', log })).resolves.toBe(client);
  expect(createDiscordFn).toHaveBeenCalledWith(expect.objectContaining({ token: 'token', clientId: 'client', intents: { Guilds: true }, log }));
  await stopDiscordClient(client);
  expect(client.shutdown).toHaveBeenCalled();
});

test('leaves Discord disabled when credentials are absent', async () => {
  const log = { info: jest.fn(), warn: jest.fn() };
  await expect(startDiscordClient({ token: '', clientId: '', log })).resolves.toBeNull();
  expect(log.warn).toHaveBeenCalled();
});

test('requires both Discord credentials', async () => {
  await expect(startDiscordClient({ token: 'token', clientId: '' })).rejects.toThrow('Both DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
});
