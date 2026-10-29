import { readLandingPageTemplate } from "./landing-page/template-reader.mjs";

const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

export function renderLandingPage(version) {
  const template = readLandingPageTemplate();
  return template.replace("{{VERSION}}", escapeHtml(version));
}
