import textLimit from "./text-limit.mjs";

const DISCORD_EMBED_DESCRIPTION_LIMIT = 4096;
const DISCORD_EMBED_TOTAL_LIMIT = 6000;
const DISCORD_EMBED_FIELD_VALUE_LIMIT = 1024;
const DISCORD_EMBED_TITLE_LIMIT = 256;
const DISCORD_EMBED_FIELD_NAME_LIMIT = 256;
const DISCORD_EMBED_AUTHOR_LIMIT = 256;
const DISCORD_EMBED_FOOTER_LIMIT = 2048;
function textLength(value) {
  return typeof value === "string" ? value.length : 0;
}
function limitEmbed(embed) {
  if (typeof embed.title === "string")
    embed.title = textLimit(embed.title, DISCORD_EMBED_TITLE_LIMIT);
  if (typeof embed.description === "string")
    embed.description = textLimit(embed.description, DISCORD_EMBED_DESCRIPTION_LIMIT);
  if (typeof embed.footer?.text === "string")
    embed.footer.text = textLimit(embed.footer.text, DISCORD_EMBED_FOOTER_LIMIT);
  if (typeof embed.author?.name === "string")
    embed.author.name = textLimit(embed.author.name, DISCORD_EMBED_AUTHOR_LIMIT);
  if (Array.isArray(embed.fields)) {
    embed.fields = embed.fields.slice(0, 25).map((field) => ({
      ...field,
      name: textLimit(field.name || "", DISCORD_EMBED_FIELD_NAME_LIMIT),
      value: textLimit(field.value || "", DISCORD_EMBED_FIELD_VALUE_LIMIT),
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
      set(textLimit(value, Math.max(0, value.length - excess)));
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
export default limitEmbed;
Object.assign(limitEmbed, {
  DISCORD_EMBED_DESCRIPTION_LIMIT,
  DISCORD_EMBED_TOTAL_LIMIT,
  DISCORD_EMBED_FIELD_VALUE_LIMIT,
  limitEmbed,
});
