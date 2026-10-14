import { log as logger } from "@eliware/common";

const string = (value) => typeof value === "string" && value.length > 0;

export function validateTargets({ config, log = logger }) {
  const targets = config?.targets;
  const valid =
    string(config?.guildId) &&
    targets &&
    typeof targets === "object" &&
    Object.values(targets).length > 0 &&
    Object.values(targets).every(
      (target) =>
        target &&
        string(target.host) &&
        string(target.user) &&
        string(target.identity) &&
        string(target.knownHosts) &&
        string(target.hostCa),
    );
  if (!valid) log.error("ConfigValidator::validateTargets failed: invalid target inventory");
  return valid;
}
