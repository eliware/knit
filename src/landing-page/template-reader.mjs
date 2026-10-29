import fs from "node:fs";

export function readLandingPageTemplate({ fsModule = fs } = {}) {
  return fsModule.readFileSync(new URL("../../assets/landing-page.html", import.meta.url), "utf8");
}
