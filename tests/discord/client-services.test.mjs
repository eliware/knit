import { jest } from "@jest/globals";
import createDiscordClientServices from "../../src/discord/client-services.mjs";

test("delegates Discord service registration and removal", () => {
  const register = jest.fn();
  const unregister = jest.fn();
  const services = createDiscordClientServices({ register, unregister });
  const options = { client: {} };

  services.register(options);
  services.unregister(options);

  expect(register).toHaveBeenCalledWith(options);
  expect(unregister).toHaveBeenCalledWith(options);
});
