export async function crosspostReleaseAnnouncement({ message, post, channelId, log }) {
  if (!post.ref?.startsWith("refs/tags/v") || typeof message?.crosspost !== "function") return;
  await message.crosspost();
  log.info("[Notifier] Cross-posted release announcement", {
    channelId,
    tag: post.ref.slice("refs/tags/".length),
  });
}
