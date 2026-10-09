/**
 * Reports which stylesheets actually loaded on an admin page.
 *
 * Computed styles showed the page falling back to Times New Roman with none of
 * Payload's CSS variables set, which points at the stylesheet never being
 * requested rather than a colour choice. This lists every stylesheet link and
 * style tag, with the HTTP result for each, so the gap is visible.
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
const path = process.argv[2] ?? "/admin/login";

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();

const cssResponses: { url: string; status: number; type: string; bytes: number }[] = [];

page.on("response", async (res) => {
  const url = res.url();
  if (!/\.css(\?|$)|text\/css/i.test(url) && !/\.css/i.test(url)) return;
  try {
    const body = await res.body();
    cssResponses.push({
      url: url.replace(BASE, ""),
      status: res.status(),
      type: res.headers()["content-type"] ?? "(none)",
      bytes: body.length,
    });
  } catch {
    cssResponses.push({
      url: url.replace(BASE, ""),
      status: res.status(),
      type: "(body unavailable)",
      bytes: 0,
    });
  }
});

const consoleErrors: string[] = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

type DomReport = {
  links: { href: string | null; resolved: string }[];
  inline: { id: string; bytes: number }[];
  sheets: { href: string; rules: number }[];
  styleTagCount: number;
};

const dom: DomReport = await page.evaluate(`(() => {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => ({
    href: l.getAttribute("href"),
    resolved: l.href
  }));
  const inline = [...document.querySelectorAll("style")].map(s => ({
    id: s.getAttribute("id") || "(no id)",
    bytes: (s.textContent || "").length
  }));
  const sheets = [...document.styleSheets].map(s => {
    let rules = 0;
    try { rules = s.cssRules.length; } catch (e) { rules = -1; }
    return { href: (s.href || "(inline)").replace(location.origin, ""), rules };
  });
  return { links, inline, sheets, styleTagCount: document.querySelectorAll("style").length };
})()`);

console.log(`\n=== ${path} ===`);
console.log(`stylesheet links in HTML: ${dom.links.length}`);
dom.links.forEach((l) => console.log(`  <link> ${l.href}`));
console.log(`inline <style> tags: ${dom.inline.length}`);
dom.inline.forEach((s) => console.log(`  <style${s.id === "(no id)" ? "" : ` id="${s.id}"`}> ${s.bytes} bytes`));
console.log(`document.styleSheets: ${dom.sheets.length}`);
dom.sheets.forEach((s) => console.log(`  ${s.href}  rules=${s.rules}`));

console.log(`\nCSS responses (${cssResponses.length}):`);
cssResponses.forEach((r) => console.log(`  ${r.status} ${r.bytes}B ${r.type} ${r.url}`));

if (consoleErrors.length) {
  console.log(`\nconsole/page errors (${consoleErrors.length}):`);
  consoleErrors.slice(0, 8).forEach((e) => console.log(`  - ${e.slice(0, 400)}`));
}

await browser.close();