/**
 * Dumps the CSS custom properties the loaded admin stylesheet actually defines.
 *
 * The earlier probe reported every Payload variable as "(unset)". Either the
 * stylesheet is not applying, or this version renamed the variables. Listing the
 * real names answers which, rather than guessing at a theme override.
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
const page = await browser.newPage();

let css = "";
page.on("response", async (res) => {
  if (!/\.css/i.test(res.url())) return;
  try {
    css += await res.text();
  } catch {
    /* ignore */
  }
});

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1000);

console.log(`CSS fetched: ${css.length} bytes`);

const defined = new Set<string>();
for (const m of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) defined.add(m[1]);
console.log(`custom properties defined: ${defined.size}`);

const buckets = new Map<string, number>();
for (const name of defined) {
  const prefix = name.split("-").slice(0, 2).join("-");
  buckets.set(prefix, (buckets.get(prefix) ?? 0) + 1);
}
console.log("\nprefix buckets:");
[...buckets.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([k, v]) => console.log(`  ${k}  (${v})`));

const interesting = [...defined].filter((n) =>
  /theme|elevation|base|color|success|error|font/i.test(n),
);
console.log(`\ntheme/base/colour-like properties: ${interesting.length}`);
interesting.slice(0, 60).forEach((n) => console.log(`  ${n}`));

// Does the sheet actually apply, or is it scoped away?
const applies = await page.evaluate(`(() => {
  const sheet = [...document.styleSheets].find(s => (s.href || "").includes(".css"));
  if (!sheet) return { error: "no external sheet" };
  let total = 0;
  let ok = 0;
  try {
    total = sheet.cssRules.length;
    for (let i = 0; i < total; i++) {
      try { sheet.cssRules[i].selectorText; ok++; } catch {}
    }
  } catch (e) {
    return { error: "cssRules blocked: " + e.message, total };
  }
  return { total, readable: ok, disabled: sheet.disabled };
})()`);

console.log("\nsheet state:", JSON.stringify(applies));

const applied = await page.evaluate(`(() => {
  const p = document.querySelector("input");
  const b = document.querySelector("button");
  const root = getComputedStyle(document.documentElement);
  return {
    inputHeight: p ? getComputedStyle(p).height : "(no input)",
    inputPadding: p ? getComputedStyle(p).padding : "(no input)",
    buttonRadius: b ? getComputedStyle(b).borderRadius : "(no button)",
    rootFontFamily: root.getPropertyValue("font-family").trim().slice(0, 60),
    definedOnRoot: root.getPropertyValue("--theme-elevation-0").trim() || "(unset)"
  };
})()`);

console.log("applied styles:", JSON.stringify(applied, null, 2));

await browser.close();