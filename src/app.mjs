import express from 'express';
import bodyParser from 'body-parser';
import { createWebhookProcessor } from './webhookProcessor.mjs';
import { log as logger, path } from '@eliware/common';


function configureMiddleware(app, assetsPath) {
    app.use('/assets', express.static(assetsPath));
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        }
    }));
}

function configureRoutes(app, processor, log) {
    app.post('/', (req, res) => {
        log.info('[App] Incoming POST / request');
        processor.process(req, res);
    });
}

export async function createApp({
    webhookProcessorFactory = createWebhookProcessor,
    publisher = undefined,
    assetsPath = path(import.meta, '..', 'assets'),
    log = logger,
} = {}) {
    const app = express();
    configureMiddleware(app, assetsPath);
    const processor = webhookProcessorFactory({ publisher, log });
    configureRoutes(app, processor, log);
    return app;
}

export function startApp({
    appInstance,
    PORT = process.env.PORT || 3456,
    log = logger,
}) {
    if (!appInstance) throw new Error('App not created. Call createApp() first.');
    const server = appInstance.listen(PORT, () => {
        log.info(`Server is listening on port ${PORT}`);
    });
    return server;
}