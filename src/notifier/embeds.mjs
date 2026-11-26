import __knitModule0 from "./genericEmbed.mjs";
import __knitModule1 from "./pushEmbed.mjs";
import __knitModule2 from "./releaseEmbed.mjs";
const { createGenericEmbed } = __knitModule0;
const { createPushEmbed } = __knitModule1;
const { createReleaseEmbed } = __knitModule2;
function createEmbed({ post = {}, event, logOutput, hasError } = {}) {
  if (post.ref?.startsWith("refs/tags/")) return createReleaseEmbed(post);
  const pushEmbed = createPushEmbed({
    post,
    logOutput,
    hasError,
  });
  if (pushEmbed) return pushEmbed;
  return createGenericEmbed({
    post,
    event,
    logOutput,
    hasError,
  });
}
export default createEmbed;
Object.assign(createEmbed, {
  createEmbed,
});
