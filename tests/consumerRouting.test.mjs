import { jest } from "@jest/globals";
import { resolveConsumerTarget } from "../src/consumerRouting.mjs";

test("forwards the repository target loader when it exists", async () => {
  const targetLoader = { load: jest.fn() };
  const RouterMod = { resolveEventTarget: jest.fn().mockResolvedValue({ name: "repo" }) };
  const RepoMod = { targetLoader };
  const log = {};
  await expect(resolveConsumerTarget({ RouterMod, RepoMod, post: {}, log })).resolves.toEqual({
    name: "repo",
  });
  expect(RouterMod.resolveEventTarget).toHaveBeenCalledWith({
    post: {},
    RepoMod,
    log,
    targetLoader,
  });
});

test("does not add a missing target loader", async () => {
  const RouterMod = { resolveEventTarget: jest.fn().mockResolvedValue(null) };
  await resolveConsumerTarget({ RouterMod, RepoMod: {}, post: {}, log: {} });
  expect(RouterMod.resolveEventTarget).toHaveBeenCalledWith({ post: {}, RepoMod: {}, log: {} });
});
