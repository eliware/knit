import { isValidTarget } from "../src/targetRules.mjs";

const validTarget = {
  host: "dev",
  user: "root",
  identity: "/key",
  knownHosts: "/known",
  hostCa: "/ca",
};

test("accepts a target with all required string fields", () => {
  expect(isValidTarget(validTarget)).toBe(true);
});

test.each(["host", "user", "identity", "knownHosts", "hostCa"])(
  "rejects a target with an empty %s field",
  (field) => {
    expect(isValidTarget({ ...validTarget, [field]: "" })).toBe(false);
  },
);

test.each([undefined, null, false, { ...validTarget, host: 1 }])(
  "rejects an invalid target value",
  (target) => {
    expect(isValidTarget(target)).toBe(false);
  },
);
