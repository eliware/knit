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
