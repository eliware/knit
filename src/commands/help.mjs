const defaultHelpMessage =
  "Knit verifies signed GitHub webhooks, runs approved workflows through SSH, and sends updates to Discord. Find setup and usage guides at https://github.com/eliware/knit/tree/main/docs.";

export default async function help(context, interaction) {
  const message = context.msg(interaction.locale, "help", defaultHelpMessage);
  await interaction.reply(message);
}
