export const DISCORD_EMBED_DESCRIPTION_LIMIT = 4096;
export const DISCORD_EMBED_TOTAL_LIMIT = 6000;
export const DISCORD_EMBED_FIELD_VALUE_LIMIT = 1024;
const DISCORD_EMBED_TITLE_LIMIT = 256;
const DISCORD_EMBED_FIELD_NAME_LIMIT = 256;
const DISCORD_EMBED_AUTHOR_LIMIT = 256;
const DISCORD_EMBED_FOOTER_LIMIT = 2048;

export function tail(value, limit, marker = "\n... [truncated; showing log tail] ...\n") {
  const text = String(value ?? "");
  if (limit <= 0) return "";
  if (text.length <= limit) return text;
  if (limit <= marker.length) return text.slice(-limit);
  return marker + text.slice(-(limit - marker.length));
}

function textLength(value) {
  return typeof value === "string" ? value.length : 0;
}

export function limitEmbed(embed) {
  if (typeof embed.title === "string") embed.title = tail(embed.title, DISCORD_EMBED_TITLE_LIMIT);
  if (typeof embed.description === "string")
    embed.description = tail(embed.description, DISCORD_EMBED_DESCRIPTION_LIMIT);
  if (typeof embed.footer?.text === "string")
    embed.footer.text = tail(embed.footer.text, DISCORD_EMBED_FOOTER_LIMIT);
  if (typeof embed.author?.name === "string")
    embed.author.name = tail(embed.author.name, DISCORD_EMBED_AUTHOR_LIMIT);
  if (Array.isArray(embed.fields)) {
    embed.fields = embed.fields.slice(0, 25).map((field) => ({
      ...field,
      name: tail(field.name || "", DISCORD_EMBED_FIELD_NAME_LIMIT),
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
  const reduceText = (get, set) => {
    const value = get();
    const excess = textSize() - DISCORD_EMBED_TOTAL_LIMIT;
    if (excess > 0 && typeof value === "string")
      set(tail(value, Math.max(0, value.length - excess)));
  };
  reduceText(
    () => embed.description,
    (value) => {
      embed.description = value;
    },
  );
  for (const field of embed.fields || []) {
    reduceText(
      () => field.value,
      (value) => {
        field.value = value;
      },
    );
  }
  for (const component of [
    [() => embed.title, (value) => (embed.title = value)],
    [() => embed.footer?.text, (value) => (embed.footer.text = value)],
    [() => embed.author?.name, (value) => (embed.author.name = value)],
    ...(embed.fields || []).map((field) => [() => field.name, (value) => (field.name = value)]),
  ]) {
    reduceText(component[0], component[1]);
  }
  return embed;
}
