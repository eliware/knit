import { readFileSync } from "node:fs";

const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

export function renderLandingPage(version) {
  const template = readFileSync(new URL("../assets/landing-page.html", import.meta.url), "utf8");
  return template.replace("{{VERSION}}", escapeHtml(version));
}
