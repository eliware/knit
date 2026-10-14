export function projectWebhookEventDetails({ data, event, deliveryId }) {
  return {
    event,
    deliveryId,
    repository: data?.repository?.full_name || data?.organization?.login || "unknown",
    action: data?.action || null,
    ref: data?.ref || null,
    workflow: data?.workflow_run?.name || data?.workflow_job?.name || data?.workflow?.name || null,
    status:
      data?.workflow_run?.status ||
      data?.workflow_job?.status ||
      data?.workflow_run?.conclusion ||
      null,
    conclusion: data?.workflow_run?.conclusion || data?.workflow_job?.conclusion || null,
  };
}
