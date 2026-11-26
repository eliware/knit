import { log as logger } from "@eliware/common";
import packageJson from "../package.json" with { type: "json" };
import Notifier from "./notifier/state.mjs";
import __knitModule0 from "./discordChannels.mjs";
import __knitModule1 from "./targetLoader.mjs";
import __knitModule2 from "./presenceManager.mjs";
const { createChannelResolver } = __knitModule0;
const { defaultTargetLoader } = __knitModule1;
const { createPresenceManager, getPresenceManager, setPresenceManager } = __knitModule2;
function registerDiscordServices({
  client,
  guildId,
  targetLoader = defaultTargetLoader,
  log = logger,
  NotifierMod = Notifier,
  createChannelResolverFn = createChannelResolver,
  createPresenceManagerFn = createPresenceManager,
  setPresenceManagerFn = setPresenceManager,
}) {
  const presenceManager = createPresenceManagerFn({
    client,
    version: packageJson.version,
    log,
  });
  setPresenceManagerFn(presenceManager);
  presenceManager.start();
  NotifierMod.setDiscordClient(client);
  const configuredGuildId = guildId || targetLoader.load().guildId;
  NotifierMod.setChannelResolver(
    createChannelResolverFn({
      client,
      guildId: configuredGuildId,
      log,
    }),
  );
  return presenceManager;
}
function unregisterDiscordServices({
  client,
  NotifierMod = Notifier,
  getPresenceManagerFn = getPresenceManager,
  setPresenceManagerFn = setPresenceManager,
}) {
  getPresenceManagerFn()?.stop?.();
  setPresenceManagerFn(null);
  NotifierMod.clearDiscordClient(client);
}
export default registerDiscordServices;
Object.assign(registerDiscordServices, {
  registerDiscordServices,
  unregisterDiscordServices,
});
