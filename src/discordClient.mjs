import { createDiscord } from '@eliware/discord';
import { log as logger, path } from '@eliware/common';
import * as Notifier from './notifier.mjs';
import { createChannelResolver } from './discordChannels.mjs';
import { defaultTargetLoader } from './targetLoader.mjs';

/**
 * Starts the shared Discord client used for channel notifications.
 * The client is optional until Discord credentials are configured.
 */
export async function startDiscordClient({
  createDiscordFn = createDiscord,
  token = process.env.DISCORD_TOKEN,
  clientId = process.env.DISCORD_CLIENT_ID,
  guildId,
  log = logger,
} = {}) {
  if (!token && !clientId) {
    log.warn?.('[Discord] DISCORD_TOKEN and DISCORD_CLIENT_ID are not configured; notifications disabled');
    return null;
  }
  if (!token || !clientId) throw new Error('Both DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
  // Knit only fetches channels and sends messages; it does not consume gateway
  // message, member, presence, reaction, typing, or scheduled-event events.
  const intents = { Guilds: true };
  const client = await createDiscordFn({
    token,
    clientId,
    rootDir: path(import.meta, '..'),
    intents,
    log,
  });
  Notifier.setDiscordClient(client);
  const configuredGuildId = guildId || defaultTargetLoader.load().guildId;
  Notifier.setChannelResolver(createChannelResolver({ client, guildId: configuredGuildId, log }));
  log.info('[Discord] Client connected for channel notifications');
  return client;
}

export async function stopDiscordClient(client) {
  if (!client) return;
  Notifier.clearDiscordClient(client);
  await client.shutdown?.();
  if (!client.shutdown && typeof client.destroy === 'function') await client.destroy();
}
