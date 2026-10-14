// Tests for src/signatureValidator.mjs
import { jest } from "@jest/globals";
import { validate } from "../src/signatureValidator.mjs";
import crypto from "crypto";

describe("signatureValidator.mjs", () => {
  it("should return false if secret or signature is missing", () => {
    expect(validate({ data: "foo", secret: "", signature: "" })).toBe(false);
  });

  it("should return true if signature matches", () => {
    const secret = "shhh";
    const data = "payload";
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(data).digest("hex");
    const timingSafeEqual = jest.spyOn(crypto, "timingSafeEqual");
    expect(validate({ data, secret, signature: expected })).toBe(true);
    expect(timingSafeEqual).toHaveBeenCalledWith(expect.any(Buffer), expect.any(Buffer));
    timingSafeEqual.mockRestore();
  });

  it("should return false if signature does not match", () => {
    expect(validate({ data: "foo", secret: "bar", signature: "bad" })).toBe(false);
  });

  it("should reject malformed signatures before comparing digests", () => {
    expect(validate({ data: "foo", secret: "bar", signature: "sha256=abc" })).toBe(false);
    expect(validate({ data: "foo", secret: "bar", signature: 42 })).toBe(false);
  });
});
