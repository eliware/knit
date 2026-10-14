import { log as logger } from "@eliware/common";
import { isValidTarget } from "./targetRules.mjs";

const string = (value) => typeof value === "string" && value.length > 0;

export function validateTargets({ config, log = logger }) {
  const targets = config?.targets;
  const valid =
    string(config?.guildId) &&
    targets &&
    typeof targets === "object" &&
    Object.values(targets).length > 0 &&
    Object.values(targets).every(isValidTarget);
  if (!valid) log.error("ConfigValidator::validateTargets failed: invalid target inventory");
  return valid;
}
