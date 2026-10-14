let sharedDiscordClient;
let resolveRepositoryChannel;

export function setDiscordClient(client) {
  sharedDiscordClient = client;
}

export function setChannelResolver(resolver) {
  resolveRepositoryChannel = resolver;
}

export function clearDiscordClient(client) {
  if (!client || sharedDiscordClient === client) {
    sharedDiscordClient = undefined;
    resolveRepositoryChannel = undefined;
  }
}

export function getNotifierState() {
  return { discordClient: sharedDiscordClient, resolveRepositoryChannel };
}
