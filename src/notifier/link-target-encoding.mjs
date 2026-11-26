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

export default escapeDiscordLinkTarget;
Object.assign(escapeDiscordLinkTarget, { escapeDiscordLinkTarget });
