import { createWebhookEnvironment } from "../src/webhookEnvironment.mjs";

test("preserves webhook values in SSH environment data", () => {
  const environment = createWebhookEnvironment({
    body: { after: "a".repeat(40) },
    event: "push",
    deliveryId: "id'; echo injected",
  });
  expect(environment.KNIT_DELIVERY_ID).toBe("id'; echo injected");
});
test("supports an empty webhook input", () => {
  expect(createWebhookEnvironment()).toEqual({
    KNIT_COMMIT_SHA: "",
    KNIT_REPOSITORY: "",
    KNIT_REF: "",
    KNIT_EVENT: "",
    KNIT_DELIVERY_ID: "",
  });
});

test("exports valid event metadata and rejects an invalid commit hash", () => {
  expect(
    createWebhookEnvironment({
      body: {
        after: "a".repeat(40),
        ref: "refs/heads/main",
        repository: { full_name: "eliware/app" },
      },
      event: "push",
      deliveryId: "delivery-1",
    }),
  ).toEqual({
    KNIT_COMMIT_SHA: "a".repeat(40),
    KNIT_REPOSITORY: "eliware/app",
    KNIT_REF: "refs/heads/main",
    KNIT_EVENT: "push",
    KNIT_DELIVERY_ID: "delivery-1",
  });
  expect(createWebhookEnvironment({ body: { after: "not-a-sha" } }).KNIT_COMMIT_SHA).toBe("");
});
