import { log as logger, redactText } from "@eliware/common";
import Repo from "./repositoryLoader.mjs";
import GitHub from "./gitHub.mjs";
import EventRouter from "./eventRouter.mjs";
import EventHandlers from "./eventHandlers.mjs";
import __knitModule0 from "./presenceManager.mjs";
import __knitModule1 from "./consumerValidation.mjs";
import __knitModule2 from "./consumerRouting.mjs";
import __knitModule3 from "./consumerOutcomePresence.mjs";
import __knitModule4 from "./consumerPush.mjs";
import __knitModule5 from "./consumerSpecializedEvent.mjs";
const { getPresenceManager } = __knitModule0;
const { validateConsumerMessage } = __knitModule1;
const { resolveConsumerTarget } = __knitModule2;
const { finishConsumerOutcome } = __knitModule3;
const { processRepositoryPush } = __knitModule4;
const { processSpecializedEvent } = __knitModule5;
async function consume({
  message,
  log = logger,
  Repo: RepoMod = Repo,
  GitHub: GitHubMod = GitHub,
  Router: RouterMod = EventRouter,
  Handlers: HandlersMod = EventHandlers.defaultRegistry,
}) {
  const post = message.parsed;
  const event = message.event || "push";
  const presence = getPresenceManager();
  const repository = post?.repository?.full_name || "webhook";
  const deliveryId = message.deliveryId ?? null;
  let stage = "validation";
  try {
    await presence?.begin(repository, deliveryId);
    if (
      !validateConsumerMessage({
        GitHubMod,
        post,
        event,
        log,
      })
    ) {
      await finishConsumerOutcome({
        presence,
        outcome: {
          type: "validation-failed",
        },
        repository,
        deliveryId,
      });
      return false;
    }
    if (event === "push") {
      return await processRepositoryPush({
        post,
        deliveryId,
        log,
        RepoMod,
        RouterMod,
        presence,
        repository,
      });
    }
    stage = "target_lookup";
    const target = await resolveConsumerTarget({
      RouterMod,
      RepoMod,
      post,
      event,
      log,
    });
    if (target.ignored) {
      if (target.kind === "repository")
        log.error("[Consumer] Repository target not found", {
          repository,
          ref: post?.ref || null,
          deliveryId,
          stage,
        });
      else log.info("[Consumer] Event ignored: no configured target", target.name);
      const isTag = await finishConsumerOutcome({
        presence,
        outcome: {
          type: "ignored-target",
        },
        repository,
        deliveryId,
        post,
      });
      return isTag;
    }
    stage = "event_handler";
    return await processSpecializedEvent({
      event,
      post,
      target,
      deliveryId,
      repository,
      log,
      HandlersMod,
      presence,
    });
  } catch (error) {
    log.error("[Consumer] Webhook processing failed", {
      repository,
      ref: post?.ref || null,
      deliveryId,
      stage,
      error: redactText(error?.message || error, {
        maxOutputLength: 300,
      }),
    });
    await finishConsumerOutcome({
      presence,
      outcome: {
        type: "processing-error",
      },
      repository,
      deliveryId,
    });
    return false;
  }
}
export default consume;
Object.assign(consume, {
  consume,
});
