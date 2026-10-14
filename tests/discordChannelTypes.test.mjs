import { GUILD_ANNOUNCEMENT } from "../src/discordChannelTypes.mjs";

test("uses Discord's announcement channel type", () => {
  expect(GUILD_ANNOUNCEMENT).toBe(5);
});
