export default async function interactionCreate(context, interaction) {
  if (!interaction.isChatInputCommand?.()) return false;
  const handler = context.commandHandlers[interaction.commandName];
  if (!handler) return false;
  await handler(context, interaction);
  return true;
}
