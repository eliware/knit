import { jest } from '@jest/globals';

describe('knit.mjs', () => {
  const log = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
  const createApp = jest.fn();
  const startApp = jest.fn();
  const errorHandlers = { removeHandlers: jest.fn() };
  const registerHandlers = jest.fn(() => errorHandlers);
  const registerSignals = jest.fn();
  const startDiscordClient = jest.fn().mockResolvedValue(null);
  const stopDiscordClient = jest.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    jest.unstable_mockModule('@eliware/common', () => ({ log, registerHandlers, registerSignals }));
    jest.unstable_mockModule('../src/app.mjs', () => ({ createApp, startApp }));
    jest.unstable_mockModule('../src/discordClient.mjs', () => ({ startDiscordClient, stopDiscordClient }));
    process.env.NODE_ENV = 'test';
    await import('../knit.mjs');
  });


  test('registers process handlers and main starts the service', async () => {
    const server = { close: jest.fn() };
    const app = {};
    createApp.mockResolvedValue(app);
    startApp.mockReturnValue(server);
    const { main } = await import('../knit.mjs');

    await main();

    expect(registerHandlers).toHaveBeenCalledWith({ log });
    expect(registerSignals).toHaveBeenCalledWith({ log });
    expect(log.info).toHaveBeenCalledWith('knit service starting...');
    expect(createApp).toHaveBeenCalledWith({ log });
    expect(startDiscordClient).toHaveBeenCalledWith({ log });
    expect(startApp).toHaveBeenCalledWith({ appInstance: app, log });
    expect(registerSignals).toHaveBeenCalledWith({ log, shutdownHook: expect.any(Function) });
    await registerSignals.mock.calls.at(-1)?.[0].shutdownHook?.();
    expect(server.close).toHaveBeenCalled();
    expect(stopDiscordClient).toHaveBeenCalledWith(null);
    expect(errorHandlers.removeHandlers).toHaveBeenCalled();
  });

  test('starts automatically outside test mode', async () => {
    process.env.NODE_ENV = 'production';
    createApp.mockResolvedValue({});
    startApp.mockReturnValue({ close: jest.fn() });

    await import('../knit.mjs?startup');

    expect(log.info).toHaveBeenCalledWith('knit service starting...');
    process.env.NODE_ENV = 'test';
  });

  test('main propagates startup errors', async () => {
    const error = new Error('boom');
    createApp.mockRejectedValue(error);
    await expect((await import('../knit.mjs')).main()).rejects.toBe(error);
  });

  test('start logs failures and exits', async () => {
    const error = new Error('boom');
    createApp.mockRejectedValue(error);
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

    await (await import('../knit.mjs')).start();

    expect(log.error).toHaveBeenCalledWith('Failed to start knit service:', error);
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });
});
