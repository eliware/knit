function escapeDiscordCode(value) {
  return String(value).replaceAll("```", "ˋˋˋ");
}

export default escapeDiscordCode;
Object.assign(escapeDiscordCode, { escapeDiscordCode });
