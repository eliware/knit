import express from 'express';
import bodyParser from 'body-parser';
import { createWebhookProcessor } from './webhookProcessor.mjs';
import { log as logger, path } from '@eliware/common';
import packageJson from '../package.json' with { type: 'json' };

function renderLandingPage(version) {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Knit is a GitHub webhook handler and SSH deployment automation service.">
    <title>Knit · GitHub deployment automation</title>
    <style>
        :root { color-scheme: dark; --ink: #f4f7fb; --muted: #9ba8bc; --panel: rgba(19, 29, 49, .78); --line: rgba(155, 168, 188, .2); --accent: #78e0c0; --accent-2: #8da9ff; }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; color: var(--ink); font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at 15% 10%, #253c69 0, transparent 35%), radial-gradient(circle at 90% 80%, #164e54 0, transparent 32%), #0b1120; }
        main { width: min(1080px, calc(100% - 40px)); margin: 0 auto; padding: 28px 0 72px; }
        nav, .hero, .card { border: 1px solid var(--line); background: var(--panel); backdrop-filter: blur(16px); }
        nav { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 18px; }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: .02em; }
        .brand img { width: 34px; height: 34px; border-radius: 10px; }
        a { color: inherit; text-decoration: none; }
        .nav-link { color: var(--muted); font-size: .92rem; }
        .nav-link:hover { color: var(--ink); }
        .hero { position: relative; overflow: hidden; margin-top: 22px; padding: clamp(34px, 8vw, 84px); border-radius: 28px; }
        .hero::after { content: ""; position: absolute; width: 220px; height: 220px; right: -70px; top: -80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-2)); opacity: .18; filter: blur(8px); }
        .eyebrow { color: var(--accent); font-size: .78rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        h1 { max-width: 720px; margin: 12px 0 18px; font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: .98; letter-spacing: -.06em; }
        .lede { max-width: 640px; margin: 0; color: var(--muted); font-size: clamp(1.05rem, 2vw, 1.3rem); }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
        .button { display: inline-flex; align-items: center; padding: 10px 16px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.06); }
        .button.primary { color: #07131a; border-color: transparent; background: var(--accent); font-weight: 750; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
        .card { padding: 24px; border-radius: 20px; }
        .icon { color: var(--accent); font-size: 1.4rem; }
        h2 { margin: 10px 0 6px; font-size: 1.12rem; }
        .card p { margin: 0; color: var(--muted); }
        footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 22px; color: var(--muted); font-size: .9rem; }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } footer { flex-direction: column; } }
    </style>
</head>
<body>
    <main>
        <nav>
            <a class="brand" href="https://github.com/eliware/knit"><img src="/assets/knit.png" alt=""> Knit</a>
            <a class="nav-link" href="/health">System status ↗</a>
        </nav>
        <section class="hero">
            <div class="eyebrow">GitHub → SSH → Discord</div>
            <h1>Ship the signal.<br>Deploy the work.</h1>
            <p class="lede">Knit receives signed GitHub events, deploys configured repositories over verified SSH targets, and keeps your team in the loop.</p>
            <div class="actions">
                <a class="button primary" href="https://github.com/eliware/knit">View the project ↗</a>
                <a class="button" href="/health">Check health</a>
            </div>
        </section>
        <section class="grid" aria-label="Knit capabilities">
            <article class="card"><div class="icon">⌁</div><h2>Webhook native</h2><p>Signed GitHub events arrive at <code>POST /</code> and are routed by repository or organization.</p></article>
            <article class="card"><div class="icon">↗</div><h2>SSH deployments</h2><p>Sequential targets, strict host verification, and repository-specific deployment workflows.</p></article>
            <article class="card"><div class="icon">✦</div><h2>Discord updates</h2><p>Deployment results are posted directly to configured Discord channels by the Knit bot.</p></article>
        </section>
        <footer><span>Running Knit ${version}</span><span>Ready to weave</span></footer>
    </main>
</body>
</html>`;
}

function configureMiddleware(app, assetsPath) {
    app.use('/assets', express.static(assetsPath));
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        }
    }));
}

function configureRoutes(app, processor, log, version) {
    app.get('/', (req, res) => {
        res.status(200).type('html').send(renderLandingPage(version));
    });

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', version });
    });

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
    version = packageJson.version,
} = {}) {
    const app = express();
    configureMiddleware(app, assetsPath);
    const processor = webhookProcessorFactory({ publisher, log });
    configureRoutes(app, processor, log, version);
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
