export const deployment = (overrides = {}) => ({
  target: "dev",
  cwd: "/opt/app",
  commands: ["one", "two"],
  ...overrides,
});

export const target = {
  host: "host",
  user: "user",
  identity: "/key",
  knownHosts: "/known",
  hostCa: "/ca",
};

export const body = { commits: [{ id: "commit" }] };
