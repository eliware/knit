import { projectWebhookEventDetails } from "../src/webhookEventDetails.mjs";

test("projects repository and workflow run details", () => {
  expect(
    projectWebhookEventDetails({
      event: "workflow_run",
      deliveryId: "delivery-1",
      data: {
        action: "completed",
        ref: "refs/heads/main",
        repository: { full_name: "eliware/demo" },
        workflow_run: { name: "Node CI", status: "completed", conclusion: "success" },
      },
    }),
  ).toEqual({
    event: "workflow_run",
    deliveryId: "delivery-1",
    repository: "eliware/demo",
    action: "completed",
    ref: "refs/heads/main",
    workflow: "Node CI",
    status: "completed",
    conclusion: "success",
  });
});

test("uses organization and workflow job details when primary fields are absent", () => {
  expect(
    projectWebhookEventDetails({
      event: "workflow_job",
      deliveryId: null,
      data: {
        organization: { login: "eliware" },
        workflow_job: { name: "Build", status: "queued", conclusion: "cancelled" },
      },
    }),
  ).toEqual({
    event: "workflow_job",
    deliveryId: null,
    repository: "eliware",
    action: null,
    ref: null,
    workflow: "Build",
    status: "queued",
    conclusion: "cancelled",
  });
});

test("uses workflow fallback fields and safe defaults", () => {
  expect(
    projectWebhookEventDetails({
      event: "workflow",
      deliveryId: undefined,
      data: { workflow: { name: "Deploy" }, workflow_run: { conclusion: "success" } },
    }),
  ).toEqual({
    event: "workflow",
    deliveryId: undefined,
    repository: "unknown",
    action: null,
    ref: null,
    workflow: "Deploy",
    status: "success",
    conclusion: "success",
  });
  expect(projectWebhookEventDetails({ data: null })).toEqual({
    event: undefined,
    deliveryId: undefined,
    repository: "unknown",
    action: null,
    ref: null,
    workflow: null,
    status: null,
    conclusion: null,
  });
});
