import { escapeDiscordMarkdown } from "./discordMarkdown.mjs";

export function collectPushChanges(post) {
  const files = { added: new Set(), removed: new Set(), modified: new Set() };
  for (const commit of post.commits) {
    for (const key of Object.keys(files)) {
      if (Array.isArray(commit?.[key])) commit[key].forEach((file) => files[key].add(file));
    }
  }
  for (const key of Object.keys(files)) {
    if (Array.isArray(post.head_commit?.[key])) {
      post.head_commit[key].forEach((file) => files[key].add(file));
    }
  }
  files.modified.forEach((file) => {
    files.added.delete(file);
    files.removed.delete(file);
  });
  return files;
}

export function pushChangeFields(post) {
  const files = collectPushChanges(post);
  return [
    ["added", "New"],
    ["removed", "Deleted"],
    ["modified", "Modified"],
  ]
    .filter(([key]) => files[key].size)
    .map(([key, label]) => ({
      name: `${label} (${files[key].size})`,
      value: [...files[key]].map(escapeDiscordMarkdown).join("\n"),
      inline: false,
    }));
}
