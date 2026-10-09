/**
 * Measures what the admin panel actually renders.
 *
 * Screenshots cannot be judged from here, so this reads computed styles
 * instead: the theme attribute, the background and text colours in use, and
 * which font is applied. That gives a before-and-after comparison that can be
 * checked without relying on an opinion about how it "looks".
 *
 * Run with: node --import tsx tools/check-admin-theme.ts
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

const BASE = process.env.ADMIN_URL ?? "http://localhost:3000";

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });

const report = await page.evaluate(`(() => {
  const html = document.documentElement;
  const body = document.body;

  const read = (el, prop) =>
    el ? getComputedStyle(el).getPropertyValue(prop).trim() : "(none)";

  // Payload paints most surfaces with these custom properties, so reading them
  // directly says what the palette resolves to.
  const rootStyle = getComputedStyle(html);
  const vars = [
    "--color-base-0",
    "--color-base-50",
    "--color-base-100",
    "--theme-elevation-0",
    "--theme-elevation-50",
    "--theme-elevation-100",
    "--theme-elevation-800",
    "--theme-success-500",
    "--theme-error-500",
    "--theme-text"
  ];

  const resolved = {};
  for (const v of vars) resolved[v] = rootStyle.getPropertyValue(v).trim() || "(unset)";

  const card = document.querySelector('[class*="nav"], [class*="card"], form');
  const heading = document.querySelector("h1, h2");
  const input = document.querySelector("input");
  const button = document.querySelector('button[type="submit"], button');

  return {
    theme: html.getAttribute("data-theme"),
    bodyBg: read(body, "background-color"),
    bodyColor: read(body, "color"),
    bodyFont: read(body, "font-family"),
    headingText: heading ? heading.textContent.trim().slice(0, 60) : "(none)",
    headingColor: read(heading, "color"),
    headingFont: read(heading, "font-family"),
    headingSize: read(heading, "font-size"),
    inputBorder: read(input, "border-color"),
    buttonBg: read(button, "background-color"),
    buttonColor: read(button, "color"),
    cardBg: read(card, "background-color"),
    vars: resolved
  };
})()`);

await page.screenshot({ path: `${process.env.TEMP ?? "."}/admin-login.png`, fullPage: false });
console.log("Screenshot written to admin-login.png");
console.log(JSON.stringify(report, null, 2));

await browser.close();