// Tests for src/app.mjs
import { jest } from '@jest/globals';
import { createApp, startApp } from '../src/app.mjs';
import express from 'express';

describe('app.mjs', () => {
  it('should create an express app with middleware and routes', async () => {
    const app = await createApp({
      webhookProcessorFactory: () => ({ process: jest.fn() }),
      publisher: {},
      assetsPath: 'assets',
      log: { info: jest.fn() }
    });
    expect(typeof app.use).toBe('function');
  });

  it('should throw if startApp is called without appInstance', () => {
    expect(() => startApp({})).toThrow('App not created. Call createApp() first.');
  });

  it('should start the app, log info, and return a server object', () => {
    const close = jest.fn();
    const listen = jest.fn((port, cb) => {
      cb();
      return { close };
    });
    const appInstance = { listen };
    const log = { info: jest.fn() };
    const server = startApp({ appInstance, PORT: 1234, log });
    expect(listen).toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith('Server is listening on port 1234');
    expect(typeof server.close).toBe('function');
    server.close();
    expect(close).toHaveBeenCalled();
  });
});
