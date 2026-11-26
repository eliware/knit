import __knitModule0 from "../../src/publisher/delivery-history.mjs";
const { createDeliveryHistory } = __knitModule0;

test("retains only the newest completed delivery IDs", () => {
  const states = new Map();
  const history = createDeliveryHistory(states);

  for (let index = 0; index <= 1000; index += 1) {
    const deliveryId = `delivery-${index}`;
    states.set(deliveryId, "pending");
    history.complete(deliveryId);
  }

  expect(states.has("delivery-0")).toBe(false);
  expect(states.get("delivery-1000")).toBe("processed");
});

test("forgets a delivery and clears completed history", () => {
  const states = new Map([["delivery-1", "pending"]]);
  const history = createDeliveryHistory(states);

  history.complete("delivery-1");
  history.forget("delivery-1");
  history.clear();

  expect(states.has("delivery-1")).toBe(false);
});
