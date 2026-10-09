/**
 * Checks the admin sign-in page shows the shop's branding rather than Payload's.
 *
 * Asserts on the rendered DOM and page title rather than a screenshot, since the
 * check has to be repeatable and unambiguous. Looks specifically for the words
 * "Payload", which is what the default sign-in screen displays.
 *
 * Run with: node --import tsx tools/check-admin-branding.ts
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

const BASE = process.env.ADMIN_URL ?? "http://localhost:3100";

let failures = 0;
function check(label: string, passed: boolean, detail = "") {
  console.log(`  [${passed ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });

type Report = {
  title: string;
  bodyText: string;
  hasKivia: boolean;
  hasPayloadWord: boolean;
  hasPayloadSvg: boolean;
  logoImages: string[];
  logoAlts: string[];
  loginFields: string[];
};

const report: Report = await page.evaluate(`(() => {
  const bodyText = document.body.innerText;
  // Payload's default mark is an inline SVG with a .graphic-logo class.
  const payloadGraphic = !!document.querySelector("svg.graphic-logo");
  const images = [...document.querySelectorAll("img")];
  return {
    title: document.title,
    bodyText: bodyText.slice(0, 400),
    hasKivia: /Kivia/i.test(bodyText) || /Kivia/i.test(document.title),
    // "Payload" as a visible word, ignoring lowercase words like "payload" in code.
    hasPayloadWord: /\\bPayload\\b/.test(bodyText) || /\\bPayload\\b/.test(document.title),
    hasPayloadSvg: payloadGraphic,
    logoImages: images.map(i => i.getAttribute("src")).filter(Boolean),
    logoAlts: images.map(i => i.getAttribute("alt")),
    loginFields: [...document.querySelectorAll("input")].map(i => i.name).filter(Boolean)
  };
})()`);

console.log("\nAdmin sign-in branding:");
console.log(`  page title: ${report.title}`);
console.log(`  visible text (first 160): ${report.bodyText.replace(/\n/g, " | ").slice(0, 160)}`);
console.log(`  images on page: ${report.logoImages.join(", ") || "(none)"}`);

check("page title names the shop", /Kivia/i.test(report.title), report.title);
check("shop name is visible on the page", report.hasKivia);
check("the word 'Payload' is gone", !report.hasPayloadWord);
check("Payload's default logo is replaced", !report.hasPayloadSvg);
check(
  "the shop logo image is present",
  report.logoImages.some((src) => src.includes("/brand/logo")),
  report.logoImages.filter((s) => s.includes("/brand")).join(", ") || "no brand image found",
);
check(
  "login form still works",
  report.loginFields.includes("email") && report.loginFields.includes("password"),
  report.loginFields.join(", "),
);

await browser.close();

console.log(failures === 0 ? "\nBranding looks right." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);