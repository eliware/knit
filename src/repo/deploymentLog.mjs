import { redactText, redactValue } from "@eliware/common";

export function logDeploymentCommand({ log, context, deployment, result }) {
  const message =
    result.code === 0 ? "[Repo] Deployment command completed" : "[Repo] Deployment command failed";
  const details = redactValue({
    ...context,
    target: deployment.target,
    command: redactText(result.command),
    exitCode: result.code,
    durationMs: result.duration ?? null,
    stage: "command",
  });
  log[result.code === 0 ? "info" : "error"]?.(message, details);
}

export function logDeploymentFailure({ log, context, target, stage, durationMs, error }) {
  const details = { ...context, target, stage, durationMs };
  if (error) {
    details.errorName = error.name;
    details.errorCode = error.code ?? null;
    details.error = redactText(error.message, { maxOutputLength: 300 });
  }
  log.error?.("[Repo] Deployment failed", redactValue(details));
}
