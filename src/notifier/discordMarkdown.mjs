const markdownCharacters = new Set([
  "\\",
  "`",
  "*",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "#",
  "+",
  "-",
  "!",
  "|",
  "~",
  ">",
]);
function escapeDiscordMarkdown(value) {
  const escaped = [...String(value)]
    .map((character) => (markdownCharacters.has(character) ? `\\${character}` : character))
    .join("");
  return escaped.replace(/@(everyone|here)\b/giu, "@\u200b$1");
}
function escapeDiscordCode(value) {
  return String(value).replaceAll("```", "ˋˋˋ");
}
function escapeDiscordLinkTarget(value) {
  const delimiters = new Map([
    ["\\", "%5C"],
    ["(", "%28"],
    [")", "%29"],
    ["<", "%3C"],
    [">", "%3E"],
  ]);
  return String(value)
    .replace(/[\\()<>]/gu, (character) => delimiters.get(character))
    .replace(/\s/gu, (character) => encodeURIComponent(character));
}
export default escapeDiscordMarkdown;
Object.assign(escapeDiscordMarkdown, {
  escapeDiscordMarkdown,
  escapeDiscordCode,
  escapeDiscordLinkTarget,
});
