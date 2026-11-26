const string = (value) => typeof value === "string" && value.length > 0;
function isValidTarget(target) {
  return Boolean(
    target &&
    string(target.host) &&
    string(target.user) &&
    string(target.identity) &&
    string(target.knownHosts) &&
    string(target.hostCa),
  );
}
export default isValidTarget;
Object.assign(isValidTarget, {
  isValidTarget,
});
