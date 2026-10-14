import { jest } from "@jest/globals";
import { validateConsumerMessage } from "../src/consumerValidation.mjs";

test("accepts valid messages and reports invalid messages", () => {
  const validate = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
  const log = { error: jest.fn() };
  const input = { GitHubMod: { validate }, post: {}, event: "push", log };
  expect(validateConsumerMessage(input)).toBe(true);
  expect(validateConsumerMessage(input)).toBe(false);
  expect(log.error).toHaveBeenCalledWith("[Consumer] GitHub validation failed");
});
