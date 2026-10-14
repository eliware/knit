import "../test-fixtures/silenceConsole.mjs";
// Tests for src/app.mjs
import { jest } from "@jest/globals";
import http from "node:http";
import { createApp } from "../src/app.mjs";

const request = (server, { method, path, body }) =>
  new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.request(
      { port, method, path, headers: { "content-type": "application/json" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ statusCode: res.statusCode, data }));
      },
    );
    req.on("error", reject);
    req.end(body);
  });

describe("app.mjs", () => {
  it("should create an express app with middleware and routes", async () => {
    const app = await createApp({
      webhookProcessorFactory: () => ({ process: jest.fn() }),
      publisher: {},
      assetsPath: "assets",
      log: { info: jest.fn() },
    });
    expect(typeof app.use).toBe("function");
  });

  it("should return health status and version", async () => {
    const app = await createApp({
      webhookProcessorFactory: () => ({ process: jest.fn() }),
      version: "9.9.9",
      assetsPath: "assets",
      log: { info: jest.fn() },
    });
    const server = app.listen(0);

    try {
      const response = await request(server, { method: "GET", path: "/health" });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.data)).toEqual({ status: "ok", version: "9.9.9" });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("should serve the Knit landing page at GET /", async () => {
    const app = await createApp({
      webhookProcessorFactory: () => ({ process: jest.fn() }),
      version: "9.9.9",
      assetsPath: "assets",
      log: { info: jest.fn() },
    });
    const server = app.listen(0);

    try {
      const response = await request(server, { method: "GET", path: "/" });
      expect(response.statusCode).toBe(200);
      expect(response.data).toContain("<title>Knit · GitHub deployment automation</title>");
      expect(response.data).toContain("Running Knit 9.9.9");
      expect(response.data).toContain("POST /");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("should apply middleware and process POST requests", async () => {
    const process = jest.fn((req, res) => res.status(202).send(req.rawBody));
    const log = { info: jest.fn() };
    const app = await createApp({
      webhookProcessorFactory: () => ({ process }),
      assetsPath: "assets",
      log,
    });
    const server = app.listen(0);

    try {
      const response = await request(server, {
        method: "POST",
        path: "/",
        body: '{"event":"push"}',
      });
      expect(response.statusCode).toBe(202);
      expect(response.data).toBe('{"event":"push"}');
      expect(log.info).toHaveBeenCalledWith("[App] Incoming POST / request");
      expect(process).toHaveBeenCalledWith(
        expect.objectContaining({ rawBody: '{"event":"push"}' }),
        expect.anything(),
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("should return the processor error for invalid JSON", async () => {
    const process = jest.fn();
    const app = await createApp({
      webhookProcessorFactory: () => ({ process }),
      assetsPath: "assets",
      log: { info: jest.fn(), warn: jest.fn() },
    });
    const server = app.listen(0);

    try {
      const response = await request(server, { method: "POST", path: "/", body: "{invalid" });
      expect(response.statusCode).toBe(400);
      expect(response.data).toBe("Webhook processing failed.");
      expect(process).not.toHaveBeenCalled();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("should pass other route errors to Express", async () => {
    const app = await createApp({
      webhookProcessorFactory: () => ({
        process: () => {
          throw new Error("route failed");
        },
      }),
      assetsPath: "assets",
      log: { info: jest.fn(), error: jest.fn() },
    });
    const server = app.listen(0);

    try {
      const response = await request(server, { method: "POST", path: "/", body: "{}" });
      expect(response.statusCode).toBe(500);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("should use the default webhook processor factory", async () => {
    await expect(createApp()).resolves.toBeDefined();
  });

  it("should use defaults when creating the app", async () => {
    const factory = jest.fn(() => ({ process: jest.fn() }));
    await expect(createApp({ webhookProcessorFactory: factory })).resolves.toBeDefined();
    expect(factory).toHaveBeenCalledWith(expect.objectContaining({ publisher: undefined }));
  });
});
