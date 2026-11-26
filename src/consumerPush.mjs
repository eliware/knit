import { redactText } from "@eliware/common";
import __knitModule0 from "./consumerRouting.mjs";
import __knitModule1 from "./consumerOutcomePresence.mjs";
const { resolveConsumerTarget } = __knitModule0;
const { finishConsumerOutcome } = __knitModule1;
async function processRepositoryPush({
  post,
  deliveryId,
  log,
  RepoMod,
  RouterMod,
  presence,
  repository,
}) {
  const context = {
    repository: post?.repository?.full_name || null,
    ref: post?.ref || null,
    deliveryId: deliveryId ?? null,
  };
  const startedAt = Date.now();
  let stage = "target_lookup";
  if (context.repository) {
    log.info("[Consumer] Repository update started", {
      ...context,
      stage,
    });
  }
  try {
    const target = await resolveConsumerTarget({
      RouterMod,
      RepoMod,
      post,
      event: "push",
      log,
    });
    if (target.ignored) {
      if (target.kind === "repository") {
        log.error("[Consumer] Repository update failed", {
          ...context,
          stage,
          durationMs: Date.now() - startedAt,
        });
      } else {
        log.info("[Consumer] Event ignored: no configured target", target.name);
      }
      return finishConsumerOutcome({
        presence,
        outcome: {
          type: "ignored-target",
        },
        repository,
        deliveryId,
        post,
      });
    }
    stage = post?.ref?.startsWith("refs/tags/") ? "tag_notice" : "deployment";
    const result = await target.repo.update({
      body: post,
      event: "push",
      deliveryId,
      log,
    });
    const message = result
      ? "[Consumer] Repository update completed"
      : "[Consumer] Repository update failed";
    log[result ? "info" : "error"](message, {
      ...context,
      stage,
      durationMs: Date.now() - startedAt,
    });
    return finishConsumerOutcome({
      presence,
      outcome: { type: "push", result },
      repository,
      deliveryId,
      post,
    });
  } catch (error) {
    log.error("[Consumer] Repository update failed", {
      ...context,
      stage,
      durationMs: Date.now() - startedAt,
      errorName: error.name,
      errorCode: error?.code ?? null,
      error: redactText(error.message, {
        maxOutputLength: 300,
      }),
    });
    return finishConsumerOutcome({
      presence,
      outcome: { type: "processing-error" },
      repository,
      deliveryId,
    });
  }
}
export default processRepositoryPush;
Object.assign(processRepositoryPush, {
  processRepositoryPush,
});
