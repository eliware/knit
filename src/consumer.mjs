import { log as logger, redactText } from "@eliware/common";
import * as Repo from "./repositoryLoader.mjs";
import * as GitHub from "./gitHub.mjs";
import * as EventRouter from "./eventRouter.mjs";
import * as EventHandlers from "./eventHandlers.mjs";
import { getPresenceManager } from "./presenceManager.mjs";
import { validateConsumerMessage } from "./consumerValidation.mjs";
import { resolveConsumerTarget } from "./consumerRouting.mjs";
import { finishConsumerOutcome } from "./consumerOutcomePresence.mjs";
import { processRepositoryPush } from "./consumerPush.mjs";
import { processSpecializedEvent } from "./consumerSpecializedEvent.mjs";

export async function consume({
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
    if (!validateConsumerMessage({ GitHubMod, post, event, log })) {
      await finishConsumerOutcome({
        presence,
        outcome: { type: "validation-failed" },
        repository,
        deliveryId,
      });
      return false;
    }
    if (event === "push") {
      const outcome = await processRepositoryPush({
        post,
        deliveryId,
        log,
        RepoMod,
        RouterMod,
      });
      return await finishConsumerOutcome({
        presence,
        outcome,
        repository,
        deliveryId,
        post,
      });
    }
    stage = "target_lookup";
    const target = await resolveConsumerTarget({ RouterMod, RepoMod, post, event, log });
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
        outcome: { type: "ignored-target" },
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
      error: redactText(error?.message || error, { maxOutputLength: 300 }),
    });
    await finishConsumerOutcome({
      presence,
      outcome: { type: "processing-error" },
      repository,
      deliveryId,
    });
    return false;
  }
}
