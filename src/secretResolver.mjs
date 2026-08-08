import fs from 'node:fs';
import path from 'node:path';

const SAFE_KEY = /^[A-Za-z0-9._-]+$/;

export function createSecretResolver({ fsModule = fs, secretPath = process.env.KNIT_DISCORD_WEBHOOK_SECRET_PATH || '/run/secrets/discord-webhooks' } = {}) {
  return {
    resolve(key) {
      if (!key) return null;
      if (typeof key !== 'string' || !SAFE_KEY.test(key)) throw new Error('Invalid notification secret key');
      const file = path.join(secretPath, key);
      if (!fsModule.existsSync(file)) return null;
      const value = String(fsModule.readFileSync(file, 'utf8')).trim();
      return value || null;
    },
  };
}

export const defaultSecretResolver = createSecretResolver();
