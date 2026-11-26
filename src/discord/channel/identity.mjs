import createChannelName from "./name-policy.mjs";

function createChannelIdentity(repository) {
  if (!/^[^/]+\/[^/]+$/u.test(repository || ""))
    throw new Error("Repository is required to resolve a Discord channel");
  return createChannelName(repository.split("/").at(-1));
}

export default createChannelIdentity;
Object.assign(createChannelIdentity, {
  createChannelIdentity,
});
