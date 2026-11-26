import { createDiscord } from "@eliware/discord";
import { log as logger, path } from "@eliware/common";
import createDiscordClientServices from "./discord/client-services.mjs";
const discordClientServices = createDiscordClientServices();
async function startDiscordClient({
  createDiscordFn = createDiscord,
  token = process.env.DISCORD_TOKEN,
  clientId = process.env.DISCORD_CLIENT_ID,
  guildId,
  targetLoader,
  log = logger,
} = {}) {
  if (!token && !clientId) {
    log.warn?.(
      "[Discord] DISCORD_TOKEN and DISCORD_CLIENT_ID are not configured. Notifications disabled",
    );
    return null;
  }
  if (!token || !clientId) throw new Error("Both DISCORD_TOKEN and DISCORD_CLIENT_ID are required");
  // Knit fetches channels and sends messages. It does not consume gateway
  // message, member, status, reaction, typing, or scheduled-event events.
  const intents = {
    Guilds: true,
  };
  const client = await createDiscordFn({
    token,
    clientId,
    rootDir: path(import.meta, ".."),
    intents,
    log,
  });
  discordClientServices.register({
    client,
    guildId,
    targetLoader,
    log,
  });
  log.info("[Discord] Client connected for channel notifications");
  return client;
}
async function stopDiscordClient(client) {
  if (!client) return;
  discordClientServices.unregister({
    client,
  });
  await client.shutdown?.();
  if (!client.shutdown && typeof client.destroy === "function") await client.destroy();
}
export default startDiscordClient;
Object.assign(startDiscordClient, {
  startDiscordClient,
  stopDiscordClient,
});
