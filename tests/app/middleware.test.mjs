import { jest } from "@jest/globals";
import configureMiddleware from "../../src/app/middleware.mjs";

test("configures static assets and request body parsing", () => {
  const app = { use: jest.fn() };

  configureMiddleware(app, "/assets");

  expect(app.use).toHaveBeenCalledTimes(2);
  expect(app.use).toHaveBeenNthCalledWith(1, "/assets", expect.any(Function));
  expect(app.use).toHaveBeenNthCalledWith(2, expect.any(Function));
});
