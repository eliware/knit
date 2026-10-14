import { createGenericEmbed } from "./genericEmbed.mjs";
import { createPushEmbed } from "./pushEmbed.mjs";
import { createReleaseEmbed } from "./releaseEmbed.mjs";

export function createEmbed({ post = {}, event, logOutput, hasError } = {}) {
  if (post.ref?.startsWith("refs/tags/")) return createReleaseEmbed(post);
  if (post.commits) return createPushEmbed({ post, logOutput, hasError });
  return createGenericEmbed({ post, event, logOutput, hasError });
}
