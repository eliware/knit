export function createGenericEmbed({ post, event, logOutput, hasError }) {
  const repository = post.repository?.full_name || "Unknown Repository";
  const action = post.action || "Event";
  const embed = {
    title:
      event && event !== "push"
        ? `${repository} - ${event}${post.action ? `: ${action}` : ""}`
        : `${repository} - ${action}`,
    color: 0x3498db,
    description: event
      ? `GitHub event **${event}** received. See details on GitHub for more information.`
      : "See details on GitHub for more information.",
    thumbnail: { url: "https://knit.eliware.org/assets/knit.png" },
    footer: { text: "GitHub Event" },
  };
  if (hasError && logOutput) embed.description += `\`\`\`text\n${logOutput}\n\`\`\``;
  return embed;
}
