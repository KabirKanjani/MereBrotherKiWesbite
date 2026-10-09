/**
 * Confirms the storefront kept its own design after the admin gained Payload's
 * stylesheet.
 *
 * The two root layouts share a build, so a wrongly-placed global CSS import
 * would show up here as Payload's system font stack or its elevation variables
 * appearing on the shop pages.
 */

import fs from "node:fs";
import { chromium } from "playwright-core";

const BROWSERS = [
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) {
  console.error("No Chromium browser found.");
  process.exit(1);
}

const BASE = process.env.SITE_URL ?? "http://localhost:3100";

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();

await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90000 });

type DesignReport = {
  h1Font: string;
  bodyBg: string;
  bodyColor: string;
  leakedElevation: string;
  leakedSuccess: string;
};

const result: DesignReport = await page.evaluate(`(() => {
  const h1 = document.querySelector("h1");
  const body = document.body;
  const root = getComputedStyle(document.documentElement);
  return {
    h1Font: h1 ? getComputedStyle(h1).fontFamily.slice(0, 60) : "(no h1)",
    bodyBg: getComputedStyle(body).backgroundColor,
    bodyColor: getComputedStyle(body).color,
    // If Payload's stylesheet leaked in, these would resolve here.
    leakedElevation: root.getPropertyValue("--theme-elevation-0").trim() || "(none)",
    leakedSuccess: root.getPropertyValue("--theme-success-500").trim() || "(none)"
  };
})()`);

console.log(JSON.stringify(result, null, 2));

const problems: string[] = [];
if (!/Fraunces|Georgia|serif/i.test(result.h1Font)) {
  problems.push(`storefront heading font is not the site serif: ${result.h1Font}`);
}
if (result.bodyBg !== "rgb(251, 248, 243)") {
  problems.push(`storefront background changed: ${result.bodyBg}`);
}
if (result.leakedElevation !== "(none)") {
  problems.push(`Payload variables leaked onto the storefront: ${result.leakedElevation}`);
}

console.log(
  problems.length ? `\nFAIL:\n${problems.map((p) => `  - ${p}`).join("\n")}` : "\nStorefront design intact.",
);

await browser.close();
process.exit(problems.length ? 1 : 0);