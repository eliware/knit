export function channelName(repository) {
  if (!/^[^/]+\/[^/]+$/.test(repository || ""))
    throw new Error("Repository is required to resolve a Discord channel");
  const name = [...repository.split("/").at(-1).toLowerCase()]
    .map((character) =>
      /^[a-z0-9-]$/.test(character) ? character : `_x${character.codePointAt(0).toString(16)}_`,
    )
    .join("");
  if (name.length > 100) throw new Error("Repository name exceeds the Discord channel name limit");
  return name;
}
