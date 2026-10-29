import { renderLandingPage } from "../src/landingPage.mjs";

test("renders the service landing page with its version", () => {
  const html = renderLandingPage("15.0.1");

  expect(html).toContain("<title>Knit · GitHub deployment automation</title>");
  expect(html).toContain("Running Knit 15.0.1");
  expect(html).toContain('href="/health"');
});

test("escapes version text before it enters the page", () => {
  const html = renderLandingPage(`<x a="&'">`);
  expect(html).toContain("Running Knit &lt;x a=&quot;&amp;&#39;&quot;&gt;");
  expect(html).not.toContain(`<x a=`);
});
