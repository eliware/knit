import __knitModule0 from "./discordMarkdown.mjs";
import escapeDiscordCode from "./code-escaping.mjs";
const { escapeDiscordMarkdown } = __knitModule0;
function createGenericEmbed({ post, event, logOutput, hasError }) {
  const repository = escapeDiscordMarkdown(post.repository?.full_name || "Unknown Repository");
  const action = escapeDiscordMarkdown(post.action || "Event");
  const eventText = event ? escapeDiscordMarkdown(event) : event;
  const embed = {
    title:
      event && event !== "push"
        ? `${repository} - ${eventText}${post.action ? `: ${action}` : ""}`
        : `${repository} - ${action}`,
    color: 0x3498db,
    description: eventText
      ? `GitHub event **${eventText}** received. See details on GitHub for more information.`
      : "See details on GitHub for more information.",
    thumbnail: {
      url: "https://knit.eliware.org/assets/knit.png",
    },
    footer: {
      text: "GitHub Event",
    },
  };
  if (hasError && logOutput)
    embed.description += `\`\`\`text\n${escapeDiscordCode(logOutput)}\n\`\`\``;
  return embed;
}
export default createGenericEmbed;
Object.assign(createGenericEmbed, {
  createGenericEmbed,
});
