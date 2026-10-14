import express from "express";
import bodyParser from "body-parser";
import { createWebhookProcessor } from "./webhookProcessor.mjs";
import { log as logger, path } from "@eliware/common";
import packageJson from "../package.json" with { type: "json" };
import { renderLandingPage } from "./landingPage.mjs";

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
    res.status(200).json({ status: "ok", version });
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

export async function createApp({
  webhookProcessorFactory = createWebhookProcessor,
  publisher = undefined,
  assetsPath = path(import.meta, "..", "assets"),
  log = logger,
  version = packageJson.version,
} = {}) {
  const app = express();
  configureMiddleware(app, assetsPath);
  const processor = webhookProcessorFactory({ publisher, log });
  configureRoutes(app, processor, log, version);
  configureErrors(app, log);
  return app;
}

export function startApp({ appInstance, PORT = process.env.PORT || 3456, log = logger }) {
  if (!appInstance) throw new Error("App not created. Call createApp() first.");
  const server = appInstance.listen(PORT, () => {
    log.info(`Server is listening on port ${PORT}`);
  });
  return server;
}
