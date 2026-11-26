function tail(value, limit, marker = "\n... [truncated, showing log tail] ...\n") {
  const text = String(value ?? "");
  if (limit <= 0) return "";
  if (text.length <= limit) return text;
  if (limit <= marker.length) return text.slice(-limit);
  return marker + text.slice(-(limit - marker.length));
}

export default tail;
Object.assign(tail, {
  tail,
});
