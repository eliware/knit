import __knitModule0 from "../../../src/discord/channel/identity.mjs";
const { createChannelIdentity } = __knitModule0;

test("requires an owner and repository", () => {
  expect(() => createChannelIdentity()).toThrow("Repository is required");
  expect(() => createChannelIdentity("owner")).toThrow("Repository is required");
});
