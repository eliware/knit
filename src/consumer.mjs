import { log as logger } from "@eliware/common";
import * as Repo from "./repositoryLoader.mjs";
import * as GitHub from "./gitHub.mjs";
import * as EventRouter from "./eventRouter.mjs";
import * as EventHandlers from "./eventHandlers.mjs";
import { getPresenceManager } from "./presenceManager.mjs";
import { validateConsumerMessage } from "./consumerValidation.mjs";
import { resolveConsumerTarget } from "./consumerRouting.mjs";
import { finishConsumerOutcome } from "./consumerOutcomePresence.mjs";

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
  try {
    const target = await resolveConsumerTarget({ RouterMod, RepoMod, post, event, log });
    if (target.ignored) {
      if (target.kind === "repository") log.error("[Consumer] Repo not found:", target.name);
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
    if (event !== "push") {
      log.info("[Consumer] Non-push event routed for specialized handling", event, target.name);
      const result = await HandlersMod.dispatch({
        event,
        post,
        target,
        deliveryId: message.deliveryId,
        log,
      });
      await finishConsumerOutcome({
        presence,
        outcome: { type: "specialized", result },
        repository,
        deliveryId,
      });
      return result;
    }
    const updated = await target.repo.update({
      body: post,
      event,
      deliveryId: message.deliveryId,
      log,
    });
    await finishConsumerOutcome({
      presence,
      outcome: { type: "push", result: updated },
      repository,
      deliveryId,
    });
    if (!updated) {
      log.error("[Consumer] Repo update failed");
      return false;
    }
    log.info("[Consumer] Repo updated successfully");
    return true;
  } catch (error) {
    log.error("[Consumer] Webhook processing failed", error);
    await finishConsumerOutcome({
      presence,
      outcome: { type: "processing-error" },
      repository,
      deliveryId,
    });
    return false;
  }
}
