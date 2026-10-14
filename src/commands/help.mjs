export default async function help(context, interaction) {
  const message = context.msg(
    interaction.locale,
    "help",
    "Knit handles signed GitHub events and deployment notifications.",
  );
  await interaction.reply(message);
}
