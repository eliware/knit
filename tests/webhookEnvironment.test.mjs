import { createWebhookEnvironment, withWebhookEnvironment } from "../src/webhookEnvironment.mjs";

test("safely exports webhook metadata for SSH shells", () => {
  const environment = createWebhookEnvironment({
    body: { after: "a".repeat(40) },
    event: "push",
    deliveryId: "id'; echo injected",
  });
  const command = withWebhookEnvironment('printf "%s" "$KNIT_DELIVERY_ID"', environment);
  expect(command).toContain("KNIT_DELIVERY_ID='id'\\\"'\\\"'; echo injected'");
  expect(command).toContain('printf "%s" "$KNIT_DELIVERY_ID"');
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
