function createChannelName(repositoryName) {
  const name = repositoryName.toLowerCase().replace(/[^a-z0-9-]/gu, "");
  if (!name) throw new Error("Repository name has no supported channel characters");
  if (name.length > 100) throw new Error("Repository name exceeds the Discord channel name limit");
  return name;
}

export default createChannelName;
Object.assign(createChannelName, { createChannelName });
