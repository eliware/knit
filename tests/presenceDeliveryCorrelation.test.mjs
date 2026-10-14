import { createPresenceDeliveryCorrelation } from "../src/presenceDeliveryCorrelation.mjs";

test("matches active deliveries before and after an uncorrelated update", () => {
  const correlation = createPresenceDeliveryCorrelation();
  expect(correlation.matches("one")).toBe(false);
  correlation.begin("one");
  expect(correlation.matches("one")).toBe(true);
  expect(correlation.matches("two")).toBe(false);
  expect(correlation.matches(null)).toBe(true);
  correlation.begin(null);
  expect(correlation.matches("one")).toBe(true);
  expect(correlation.matches("two")).toBe(false);
  expect(correlation.matches(null)).toBe(true);
});

test("clears the current delivery after reset", () => {
  const correlation = createPresenceDeliveryCorrelation();
  correlation.end("unknown");
  correlation.begin("one");
  correlation.reset();
  expect(correlation.matches("two")).toBe(false);
});

test("keeps a delivery active until each matching task ends", () => {
  const correlation = createPresenceDeliveryCorrelation();
  correlation.begin("one");
  correlation.begin("one");
  correlation.end("one");
  expect(correlation.matches("one")).toBe(true);
  correlation.end("one");
  expect(correlation.matches("two")).toBe(false);
});
