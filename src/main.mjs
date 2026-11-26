import "dotenv/config";
import { log, registerHandlers, registerSignals } from "@eliware/common";
import __knitModule0 from "./app.mjs";
import __knitModule1 from "./server.mjs";
import __knitModule2 from "./discordClient.mjs";
import __knitModule3 from "./targetLoader.mjs";
const { createApp } = __knitModule0;
const { startApp } = __knitModule1;
const { startDiscordClient, stopDiscordClient } = __knitModule2;
const { defaultTargetLoader } = __knitModule3;
const errorHandlers = registerHandlers({
  log,
});
registerSignals({
  log,
});
async function main() {
  log.info("Knit is starting...");
  if (!(await defaultTargetLoader.validateAll()))
    throw new Error("Knit target configuration validation failed");
  const discordClient = await startDiscordClient({
    log,
  });
  const app = await createApp({
    log,
  });
  const server = startApp({
    appInstance: app,
    log,
  });
  registerSignals({
    log,
    shutdownHook: async (signal) => {
      await server.close();
      await stopDiscordClient(discordClient);
      errorHandlers.removeHandlers?.();
      log.debug(`Shutdown complete after ${signal}`);
    },
  });
}
function start() {
  return main().catch((err) => {
    log.error("Knit could not start:", err);
    process.exit(1);
  });
}
if (process.env.NODE_ENV !== "test") {
  start();
}
export default main;
Object.assign(main, {
  main,
  start,
});
