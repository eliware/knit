import { jest } from "@jest/globals";
import { provisionAnnouncementChannel } from "../src/discordChannelProvisioning.mjs";

test("returns a matching announcement channel", async () => {
  const existing = { name: "app", type: 5 };
  const create = jest.fn();
  const guild = {
    channels: { fetch: jest.fn().mockResolvedValue([existing]), create },
  };

  await expect(
    provisionAnnouncementChannel({ guild, name: "app", privateRepository: false }),
  ).resolves.toBe(existing);
  expect(create).not.toHaveBeenCalled();
});

test("creates an announcement channel when a same-name text channel exists", async () => {
  const create = jest.fn().mockResolvedValue({ id: "announcement" });
  const guild = {
    roles: { everyone: { id: "everyone" } },
    channels: { fetch: jest.fn().mockResolvedValue([{ name: "app", type: 0 }]), create },
  };
  await expect(
    provisionAnnouncementChannel({
      guild,
      name: "app",
      privateRepository: false,
      log: { info: jest.fn() },
    }),
  ).resolves.toEqual({ id: "announcement" });
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: "app", type: 5 }));
});

test("creates an announcement channel with repository access rules", async () => {
  const channel = { id: "new" };
  const create = jest.fn().mockResolvedValue(channel);
  const guild = {
    roles: { everyone: { id: "everyone" } },
    channels: { fetch: jest.fn().mockResolvedValue([]), create },
  };
  const log = { info: jest.fn() };

  await expect(
    provisionAnnouncementChannel({
      guild,
      name: "app",
      privateRepository: true,
      repository: "eliware/app",
      log,
    }),
  ).resolves.toBe(channel);
  expect(create).toHaveBeenCalledTimes(1);
  expect(log.info).toHaveBeenCalled();
});
