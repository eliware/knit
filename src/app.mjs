import express from "express";
import { log as logger, path } from "@eliware/common";
import packageJson from "../package.json" with { type: "json" };
import __knitModule0 from "./webhookProcessor.mjs";
import __knitModule1 from "./landingPage.mjs";
import __knitModule2 from "./app/middleware.mjs";
import __knitModule3 from "./app/error-handler.mjs";
const { createWebhookProcessor } = __knitModule0;
const { renderLandingPage } = __knitModule1;
const { configureMiddleware } = __knitModule2;
const { configureErrorHandler } = __knitModule3;
function configureRoutes(app, processor, log, version) {
  app.get("/", (req, res) => {
    res.status(200).type("html").send(renderLandingPage(version));
  });
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      version,
    });
  });
  app.post("/", (req, res) => {
    log.info("[App] Incoming POST / request");
    processor.process(req, res);
  });
}
async function createApp({
  webhookProcessorFactory = createWebhookProcessor,
  publisher = undefined,
  assetsPath = path(import.meta, "..", "assets"),
  log = logger,
  version = packageJson.version,
} = {}) {
  const app = express();
  configureMiddleware(app, assetsPath);
  const processor = webhookProcessorFactory({
    publisher,
    log,
  });
  configureRoutes(app, processor, log, version);
  configureErrorHandler(app, log);
  return app;
}
export default createApp;
Object.assign(createApp, {
  createApp,
});
