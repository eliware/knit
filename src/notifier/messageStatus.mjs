export function applyMessageStatus(embed, hasError) {
  if (hasError) {
    embed.color = 0xff0000;
    embed.title = `\u274c Error: ${embed.title}`;
  } else {
    embed.title = `\u2705 ${embed.title}`;
  }
  return embed;
}
