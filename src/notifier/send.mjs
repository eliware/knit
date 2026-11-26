import { log as logger } from "@eliware/common";
import __knitModule0 from "./message.mjs";
import __knitModule1 from "./state.mjs";
import __knitModule2 from "./delivery.mjs";
const { prepareNotificationMessage } = __knitModule0;
const { getNotifierState } = __knitModule1;
const { deliverDiscordMessage } = __knitModule2;
async function send({
  channelId,
  post = {},
  event = "push",
  embed: providedEmbed,
  logOutput,
  hasError,
  packageJson,
  log = logger,
  discordClient,
}) {
  const state = getNotifierState();
  discordClient ??= state.discordClient;
  const resolveRepositoryChannel = state.resolveRepositoryChannel;
  if (!channelId && resolveRepositoryChannel)
    channelId = await resolveRepositoryChannel({
      repository: post.repository?.full_name,
      privateRepository: post.repository?.private === true,
      packageJson,
    });
  if (!channelId) return;
  if (!discordClient) throw new Error("Discord client is not connected");
  const embed = await prepareNotificationMessage({
    providedEmbed,
    post,
    event,
    logOutput,
    hasError,
  });
  await deliverDiscordMessage({
    discordClient,
    channelId,
    embed,
    post,
    event,
    log,
  });
}
export default send;
Object.assign(send, {
  send,
});
