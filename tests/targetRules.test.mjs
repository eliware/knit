import { target } from "../test-fixtures/repo.mjs";
import __knitModule0 from "../src/targetRules.mjs";
const { isValidTarget } = __knitModule0;
test("accepts a target with all required string fields", () => {
  expect(isValidTarget(target)).toBe(true);
});
test.each(["host", "user", "identity", "knownHosts", "hostCa"])(
  "rejects a target with an empty %s field",
  (field) => {
    expect(
      isValidTarget({
        ...target,
        [field]: "",
      }),
    ).toBe(false);
  },
);
test.each([
  undefined,
  null,
  false,
  {
    ...target,
    host: 1,
  },
])("rejects an invalid target value", (target) => {
  expect(isValidTarget(target)).toBe(false);
});
