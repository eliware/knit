import __knitModule0 from "./landing-page/template-reader.mjs";
const { readLandingPageTemplate } = __knitModule0;
const htmlEscapes = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}
function renderLandingPage(version) {
  const template = readLandingPageTemplate();
  return template.replace("{{VERSION}}", escapeHtml(version));
}
export default renderLandingPage;
Object.assign(renderLandingPage, {
  renderLandingPage,
});
