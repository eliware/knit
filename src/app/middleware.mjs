import express from "express";
import bodyParser from "body-parser";

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

export default configureMiddleware;
Object.assign(configureMiddleware, { configureMiddleware });
