export const DISCORD_EMBED_DESCRIPTION_LIMIT = 4096;
export const DISCORD_EMBED_TOTAL_LIMIT = 6000;
export const DISCORD_EMBED_FIELD_VALUE_LIMIT = 1024;

export function tail(value, limit, marker = "\n... [truncated; showing log tail] ...\n") {
  const text = String(value ?? "");
  if (text.length <= limit) return text;
  if (limit <= marker.length) return text.slice(-limit);
  return marker + text.slice(-(limit - marker.length));
}

function textLength(value) {
  return typeof value === "string" ? value.length : 0;
}

export function limitEmbed(embed) {
  if (embed.description)
    embed.description = tail(embed.description, DISCORD_EMBED_DESCRIPTION_LIMIT);
  if (Array.isArray(embed.fields)) {
    embed.fields = embed.fields.slice(0, 25).map((field) => ({
      ...field,
      name: tail(field.name || "", 256),
      value: tail(field.value || "", DISCORD_EMBED_FIELD_VALUE_LIMIT),
    }));
  }
  const textSize = () =>
    textLength(embed.title) +
    textLength(embed.description) +
    textLength(embed.footer?.text) +
    textLength(embed.author?.name) +
    (embed.fields || []).reduce(
      (size, field) => size + textLength(field.name) + textLength(field.value),
      0,
    );
  if (textSize() > DISCORD_EMBED_TOTAL_LIMIT && embed.description) {
    const other = textSize() - textLength(embed.description);
    embed.description = tail(embed.description, Math.max(0, DISCORD_EMBED_TOTAL_LIMIT - other));
  }
  return embed;
}
