function validateChannelNameLength(name) {
  if (name.length > 100) throw new Error("Repository name exceeds the Discord channel name limit");
  return name;
}

export default validateChannelNameLength;
Object.assign(validateChannelNameLength, {
  validateChannelNameLength,
});
