import "dotenv/config";
import { log, registerHandlers, registerSignals } from "@eliware/common";
import { createApp } from "./app.mjs";
import { startApp } from "./server.mjs";
import { startDiscordClient, stopDiscordClient } from "./discordClient.mjs";
import { defaultTargetLoader } from "./targetLoader.mjs";

const errorHandlers = registerHandlers({ log });
registerSignals({ log });

export async function main() {
  log.info("knit service starting...");
  if (!(await defaultTargetLoader.validateAll()))
    throw new Error("Knit target configuration validation failed");
  const discordClient = await startDiscordClient({ log });
  const app = await createApp({ log });
  const server = startApp({ appInstance: app, log });
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

export function start() {
  return main().catch((err) => {
    log.error("Failed to start knit service:", err);
    process.exit(1);
  });
}

if (process.env.NODE_ENV !== "test") {
  start();
}
