import { jest } from "@jest/globals";
import "../test-fixtures/silenceConsole.mjs";
import { startApp } from "../src/server.mjs";

test("requires an app before server start", () => {
  expect(() => startApp({})).toThrow("App not created. Call createApp() first.");
});

test("starts the app, logs the port, and returns the server", () => {
  const close = jest.fn();
  const listen = jest.fn((port, callback) => {
    callback();
    return { close };
  });
  const log = { info: jest.fn() };
  const server = startApp({ appInstance: { listen }, PORT: 1234, log });
  expect(listen).toHaveBeenCalledWith(1234, expect.any(Function));
  expect(log.info).toHaveBeenCalledWith("Server is listening on port 1234");
  expect(typeof server.close).toBe("function");
  server.close();
  expect(close).toHaveBeenCalled();
});

test("uses the default port and logger", () => {
  const listen = jest.fn((port, callback) => {
    callback();
    return {};
  });
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
