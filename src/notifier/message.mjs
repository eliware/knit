import __knitModule0 from "./embedLimits.mjs";
import __knitModule1 from "./embeds.mjs";
import __knitModule2 from "./messageStatus.mjs";
const { limitEmbed } = __knitModule0;
const { createEmbed } = __knitModule1;
const { applyMessageStatus } = __knitModule2;
async function prepareNotificationMessage({ providedEmbed, post, event, logOutput, hasError }) {
  const embed = providedEmbed
    ? {
        ...providedEmbed,
        fields: providedEmbed.fields?.map((field) => ({
          ...field,
        })),
      }
    : await createEmbed({
        post,
        event,
        logOutput,
        hasError,
      });
  return limitEmbed(applyMessageStatus(embed, hasError));
}
export default prepareNotificationMessage;
Object.assign(prepareNotificationMessage, {
  prepareNotificationMessage,
});
