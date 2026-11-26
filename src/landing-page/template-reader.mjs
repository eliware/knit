import fs from "node:fs";
function readLandingPageTemplate({ fsModule = fs } = {}) {
  return fsModule.readFileSync(new URL("../../assets/landing-page.html", import.meta.url), "utf8");
}
export default readLandingPageTemplate;
Object.assign(readLandingPageTemplate, {
  readLandingPageTemplate,
});
