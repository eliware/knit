import express from "express";
import bodyParser from "body-parser";
import { log as logger, path } from "@eliware/common";
import packageJson from "../package.json" with { type: "json" };
import __knitModule0 from "./webhookProcessor.mjs";
import __knitModule1 from "./landingPage.mjs";
const { createWebhookProcessor } = __knitModule0;
const { renderLandingPage } = __knitModule1;
function configureMiddleware(app, assetsPath) {
  app.use("/assets", express.static(assetsPath));
  app.use(
    bodyParser.json({
      verify: (req, res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    }),
  );
}
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
function configureErrors(app, log) {
  app.use((error, request, response, next) => {
    if (error?.type === "entity.parse.failed") {
      log.warn?.("[App] Invalid JSON request body");
      return response.status(400).send("Webhook processing failed.");
    }
    return next(error);
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
  configureErrors(app, log);
  return app;
}
export default createApp;
Object.assign(createApp, {
  createApp,
});
