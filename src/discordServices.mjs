import * as Notifier from "./notifier/index.mjs";
import { createChannelResolver } from "./discordChannels.mjs";
import { defaultTargetLoader } from "./targetLoader.mjs";
import { createPresenceManager, setPresenceManager } from "./presenceManager.mjs";
import packageJson from "../package.json" with { type: "json" };

export function registerDiscordServices({
  client,
  guildId,
  targetLoader = defaultTargetLoader,
  log = console,
  NotifierMod = Notifier,
  createChannelResolverFn = createChannelResolver,
  createPresenceManagerFn = createPresenceManager,
  setPresenceManagerFn = setPresenceManager,
}) {
  const presenceManager = createPresenceManagerFn({ client, version: packageJson.version, log });
  setPresenceManagerFn(presenceManager);
  presenceManager.start();
  NotifierMod.setDiscordClient(client);
  const configuredGuildId = guildId || targetLoader.load().guildId;
  NotifierMod.setChannelResolver(
    createChannelResolverFn({ client, guildId: configuredGuildId, log }),
  );
  return presenceManager;
}

export function unregisterDiscordServices({
  client,
  NotifierMod = Notifier,
  setPresenceManagerFn = setPresenceManager,
}) {
  setPresenceManagerFn(null);
  NotifierMod.clearDiscordClient(client);
}
