const markdownCharacters = new Set(["\\", "`", "*", "_", "[", "]", "|", "~"]);
function escapeDiscordMarkdown(value) {
  const normalized = String(value).replace(/&#(?:x0*20|0*32);/giu, " ");
  const escaped = [...normalized]
    .map((character, index) => {
      const isLinkSyntax = character === "(" && normalized[index - 1] === "]";
      return markdownCharacters.has(character) || isLinkSyntax ? `\\${character}` : character;
    })
    .join("");
  const safeLines = escaped.replace(/(^|\n)([ \t]*)([#>+-])(?=[ \t])/gu, "$1$2\\$3");
  return safeLines.replace(/@(everyone|here)\b/giu, "@\u200b$1");
}
export default escapeDiscordMarkdown;
Object.assign(escapeDiscordMarkdown, { escapeDiscordMarkdown });
