import { jest } from "@jest/globals";
import { readLandingPageTemplate } from "../../src/landing-page/template-reader.mjs";

test("reads the landing page template as UTF-8", () => {
  const readFileSync = jest.fn().mockReturnValue("<main>{{VERSION}}</main>");

  expect(readLandingPageTemplate({ fsModule: { readFileSync } })).toBe("<main>{{VERSION}}</main>");
  expect(readFileSync).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: expect.stringMatching(/\/assets\/landing-page\.html$/u) }),
    "utf8",
  );
});
