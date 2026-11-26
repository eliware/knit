import __knitModule0 from "../discordChannelPermissions.mjs";
import __knitModule1 from "../discordChannelTopic.mjs";
const { syncChannelPermissions } = __knitModule0;
const { syncChannelTopic } = __knitModule1;

async function syncChannelMetadata({ channel, guild, privateRepository, packageJson }) {
  await syncChannelPermissions(channel, guild, privateRepository);
  await syncChannelTopic(channel, packageJson);
}

export default syncChannelMetadata;
Object.assign(syncChannelMetadata, { syncChannelMetadata });
