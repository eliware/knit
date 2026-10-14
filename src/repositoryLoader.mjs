import { log as logger } from "@eliware/common";
import * as ConfigValidator from "./configValidator.mjs";
import { loadWorkflow } from "./workflowLoader.mjs";
import { defaultTargetLoader } from "./targetLoader.mjs";
import { createSshRepo } from "./repo.mjs";
export async function get({
  name,
  body,
  event = "push",
  log = logger,
  targetLoader = defaultTargetLoader,
  workflowLoader = loadWorkflow,
} = {}) {
  try {
    const targets = targetLoader.load();
    if (event !== "push")
      return createSshRepo({ config: { deployments: [] }, targets: targets.targets || {}, log });
    const commit = body?.after;
    const { workflow, packageJson } = await workflowLoader({ repository: name, commit });
    if (!ConfigValidator.validateWorkflow({ config: workflow, log }))
      throw new Error("Invalid repository workflow");
    const action = ConfigValidator.selectWorkflowAction({ config: workflow, post: body });
    if (!action) return null;
    for (const deployment of action.deployments) {
      const target = targets.targets?.[deployment.target];
      if (!target) throw new Error(`Unknown deployment target: ${deployment.target}`);
      if (target.allowedRepositories && !target.allowedRepositories.includes(name))
        throw new Error(`Repository is not authorized for target: ${deployment.target}`);
    }
    return createSshRepo({
      config: { ...action, stopOnError: action.stopOnError },
      targets: targets.targets,
      packageJson,
      log,
    });
  } catch (error) {
    log.error?.("[Repo] Workflow load failed", { name, error: error.message });
    return null;
  }
}
