import { log as logger } from "@eliware/common";
import ConfigValidator from "./configValidator.mjs";
import __knitModule0 from "./workflowActionSelector.mjs";
import __knitModule1 from "./workflowLoader.mjs";
import __knitModule2 from "./targetLoader.mjs";
import __knitModule3 from "./repo.mjs";
const { selectWorkflowAction } = __knitModule0;
const { loadWorkflow } = __knitModule1;
const { defaultTargetLoader } = __knitModule2;
const { createSshRepo } = __knitModule3;
async function get({
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
      return createSshRepo({
        config: {
          deployments: [],
        },
        targets: targets.targets || {},
        log,
      });
    const commit = body?.after;
    const { workflow, packageJson } = await workflowLoader({
      repository: name,
      commit,
    });
    if (
      !ConfigValidator.validateWorkflow({
        config: workflow,
        log,
      })
    )
      throw new Error("Invalid repository workflow");
    const action = selectWorkflowAction({
      config: workflow,
      post: body,
    });
    if (!action) return null;
    for (const deployment of action.deployments) {
      const target = targets.targets?.[deployment.target];
      if (!target) throw new Error(`Unknown deployment target: ${deployment.target}`);
      if (target.allowedRepositories && !target.allowedRepositories.includes(name))
        throw new Error(`Repository is not approved for target: ${deployment.target}`);
    }
    return createSshRepo({
      config: {
        ...action,
        stopOnError: action.stopOnError,
      },
      targets: targets.targets,
      packageJson,
      log,
    });
  } catch (error) {
    log.error?.("[Repo] Workflow load failed", {
      name,
      error: error.message,
    });
    return null;
  }
}
export default get;
Object.assign(get, {
  get,
});
