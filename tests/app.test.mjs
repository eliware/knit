// Tests for src/app.mjs
import { jest } from '@jest/globals';
import http from 'node:http';
import { createApp, startApp } from '../src/app.mjs';

const request = (server, { method, path, body }) => new Promise((resolve, reject) => {
  const { port } = server.address();
  const req = http.request({ port, method, path, headers: { 'content-type': 'application/json' } }, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => resolve({ statusCode: res.statusCode, data }));
  });
  req.on('error', reject);
  req.end(body);
});

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

  it('should apply middleware and process POST requests', async () => {
    const process = jest.fn((req, res) => res.status(202).send(req.rawBody));
    const log = { info: jest.fn() };
    const app = await createApp({ webhookProcessorFactory: () => ({ process }), assetsPath: 'assets', log });
    const server = app.listen(0);

    try {
      const response = await request(server, { method: 'POST', path: '/', body: '{"event":"push"}' });
      expect(response.statusCode).toBe(202);
      expect(response.data).toBe('{"event":"push"}');
      expect(log.info).toHaveBeenCalledWith('[App] Incoming POST / request');
      expect(process).toHaveBeenCalledWith(expect.objectContaining({ rawBody: '{"event":"push"}' }), expect.anything());
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('should use the default webhook processor factory', async () => {
    await expect(createApp()).resolves.toBeDefined();
  });

  it('should use defaults when creating the app', async () => {
    const factory = jest.fn(() => ({ process: jest.fn() }));
    await expect(createApp({ webhookProcessorFactory: factory })).resolves.toBeDefined();
    expect(factory).toHaveBeenCalledWith(expect.objectContaining({ publisher: undefined }));
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
    expect(listen).toHaveBeenCalledWith(1234, expect.any(Function));
    expect(log.info).toHaveBeenCalledWith('Server is listening on port 1234');
    expect(typeof server.close).toBe('function');
    server.close();
    expect(close).toHaveBeenCalled();
  });

  it('should use the default port and logger when starting', () => {
    const listen = jest.fn((port, cb) => { cb(); return {}; });
    const originalPort = process.env.PORT;
    delete process.env.PORT;
    try {
      expect(startApp({ appInstance: { listen } })).toEqual({});
      expect(listen).toHaveBeenCalledWith(3456, expect.any(Function));
    } finally {
      if (originalPort === undefined) delete process.env.PORT;
      else process.env.PORT = originalPort;
    }
  });
});
