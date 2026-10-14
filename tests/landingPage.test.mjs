import { renderLandingPage } from "../src/landingPage.mjs";

test("renders the service landing page with its version", () => {
  const html = renderLandingPage("12.0.0");

  expect(html).toContain("<title>Knit · GitHub deployment automation</title>");
  expect(html).toContain("Running Knit 12.0.0");
  expect(html).toContain('href="/health"');
});
