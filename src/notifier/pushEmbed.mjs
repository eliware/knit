import __knitModule0 from "./pushChanges.mjs";
import __knitModule1 from "./pushDescription.mjs";
import __knitModule2 from "./discordMarkdown.mjs";
import __knitModule3 from "./pushAuthor.mjs";
const { pushChangeFields } = __knitModule0;
const { createPushDescription } = __knitModule1;
const { escapeDiscordMarkdown } = __knitModule2;
const { createPushAuthor } = __knitModule3;
function createPushEmbed({ post = {}, logOutput, hasError }) {
  if (!post.commits) return null;
  const repository = post.repository?.full_name || "Unknown Repository";
  const embed = {
    title: `New Commits Pushed to ${escapeDiscordMarkdown(repository)}`,
    url: post.repository?.html_url || "",
    color: 0x00ff00,
    timestamp: post.head_commit?.timestamp || new Date().toISOString(),
    thumbnail: {
      url: "https://knit.eliware.org/assets/knit.png",
    },
    description: createPushDescription({
      post,
      logOutput,
      hasError,
    }),
    fields: pushChangeFields(post),
    footer: {
      text: "GitHub Push Event",
    },
  };
  embed.author = createPushAuthor(post);
  return embed;
}
export default createPushEmbed;
Object.assign(createPushEmbed, {
  createPushEmbed,
});
