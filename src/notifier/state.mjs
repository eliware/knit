let sharedDiscordClient;
let resolveRepositoryChannel;
function setDiscordClient(client) {
  sharedDiscordClient = client;
}
function setChannelResolver(resolver) {
  resolveRepositoryChannel = resolver;
}
function clearDiscordClient(client) {
  if (!client || sharedDiscordClient === client) {
    sharedDiscordClient = undefined;
    resolveRepositoryChannel = undefined;
  }
}
function getNotifierState() {
  return {
    discordClient: sharedDiscordClient,
    resolveRepositoryChannel,
  };
}
export default setDiscordClient;
Object.assign(setDiscordClient, {
  setDiscordClient,
  setChannelResolver,
  clearDiscordClient,
  getNotifierState,
});
