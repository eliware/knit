import { createGenericEmbed } from "./genericEmbed.mjs";
import { createPushEmbed } from "./pushEmbed.mjs";
import { createReleaseEmbed } from "./releaseEmbed.mjs";

export function createEmbed({ post = {}, event, logOutput, hasError } = {}) {
  if (post.ref?.startsWith("refs/tags/")) return createReleaseEmbed(post);
  const pushEmbed = createPushEmbed({ post, logOutput, hasError });
  if (pushEmbed) return pushEmbed;
  return createGenericEmbed({ post, event, logOutput, hasError });
}
