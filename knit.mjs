#!/usr/bin/env node
import 'dotenv/config';
import log from '@eliware/log';
import { registerHandlers, registerSignals } from '@eliware/common';
import { createApp, startApp } from './src/app.mjs';

registerHandlers({ log });
registerSignals({ log });

async function main() {
  log.info('knit service starting...');
  const app = await createApp({ log });
  const server = startApp({ appInstance: app, log });
  registerSignals({ log, shutdownHook: () => server.close() });
}

if (process.env.NODE_ENV !== 'test') {
  main().catch(err => {
    log.error('Failed to start knit service:', err);
    process.exit(1);
  });
}