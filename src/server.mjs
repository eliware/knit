import { log as logger } from "@eliware/common";

export function startApp({ appInstance, PORT = process.env.PORT || 3456, log = logger }) {
  if (!appInstance) throw new Error("App not created. Call createApp() first.");
  const server = appInstance.listen(PORT, () => {
    log.info(`Server is listening on port ${PORT}`);
  });
  return server;
}
