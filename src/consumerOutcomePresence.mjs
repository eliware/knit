import { finishConsumerPresence } from "./consumerPresence.mjs";

export async function finishConsumerOutcome({ presence, outcome, repository, deliveryId, post }) {
  let result = false;
  let text = `${repository} failure`;
  let failed = true;
  let neutral = false;

  if (outcome.type === "ignored-target") {
    result = Boolean(post?.ref?.startsWith("refs/tags/"));
    text = result ? `${repository} ignored` : `${repository} failure`;
    failed = !result;
    neutral = result;
  } else if (outcome.type === "specialized") {
    result = outcome.result;
    text = `${result ? "completed" : "failed"} ${repository}`;
    failed = !result;
  } else if (outcome.type === "push") {
    result = outcome.result;
    text = `${repository} ${result ? "success" : "failure"}`;
    failed = !result;
  } else if (outcome.type !== "validation-failed" && outcome.type !== "processing-error") {
    throw new Error(`Unknown consumer outcome: ${outcome.type}`);
  }

  await finishConsumerPresence({ presence, text, deliveryId, failed, neutral });
  return result;
}
