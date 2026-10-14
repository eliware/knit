import { log as logger } from "@eliware/common";
export { validateTargets } from "./targetValidator.mjs";

const string = (value) => typeof value === "string" && value.length > 0;
const commands = (value) => Array.isArray(value) && value.length > 0 && value.every(string);
const timeout = (value) =>
  value === undefined || (Number.isInteger(value) && value > 0 && value <= 300000);
export function validateWorkflow({ config, log = logger }) {
  const validDeployment = (deployment) =>
    typeof deployment === "object" &&
    string(deployment.target) &&
    string(deployment.cwd) &&
    deployment.cwd.startsWith("/") &&
    commands(deployment.commands) &&
    timeout(deployment.timeoutMs);
  const validAction = (action) =>
    action &&
    Array.isArray(action.deployments) &&
    action.deployments.length > 0 &&
    action.deployments.every(validDeployment);
  const tags = config?.on?.tags;
  const validTags =
    tags === undefined ||
    (tags &&
      typeof tags === "object" &&
      Object.keys(tags).length > 0 &&
      Object.keys(tags).every((pattern) => /^v\*?$/.test(pattern) && validAction(tags[pattern])));
  const valid = config?.version === 1 && validAction(config?.on?.push) && validTags;
  if (!valid) log.error("ConfigValidator::validateWorkflow failed: invalid .knit/deploy.yaml");
  return valid;
}
