/**
 * Signs in to the admin and checks the usability features actually render.
 *
 * This drives a real browser rather than fetching HTML, because the parts worth
 * verifying here — the dashboard widget, the photo thumbnails in the list, the
 * reorder buttons and the renamed sidebar — are all things that can return 200
 * while being absent from the page.
 *
 * Credentials come from the environment so nothing is committed.
 *
 * Run with:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node --import tsx tools/check-admin-ui.ts
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
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this.");
  process.exit(1);
}

let failures = 0;
function check(label: string, passed: boolean, detail = "") {
  console.log(`  [${passed ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors: string[] = [];
page.on("pageerror", (e) => consoleErrors.push(e.message));

// ---- sign in --------------------------------------------------------------
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASSWORD);
await Promise.all([
  page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 }),
  page.click('button[type="submit"]'),
]);

console.log(`\nSigned in, landed on ${new URL(page.url()).pathname}`);

type DashboardReport = {
  hasOverview: boolean;
  hasLiveCount: boolean;
  hasDraftHint: boolean;
  sidebar: string[];
};

type ListReport = {
  rowCount: number;
  thumbnailCount: number;
  upButtons: number;
  downButtons: number;
  headings: string[];
};

type FormReport = {
  tabCount: number;
  tabs: string[];
  hasPlainName: boolean;
  hasSortExplained: boolean;
  jargonPresent: string[];
};

const dashboard: DashboardReport = await page.evaluate(`(() => {
  const text = document.body.innerText;
  return {
    hasOverview: text.includes("Shop overview"),
    hasLiveCount: /Styles live/i.test(text),
    hasDraftHint: /Waiting to publish/i.test(text),
    sidebar: [...document.querySelectorAll("nav a, aside a")]
      .map(a => a.textContent.trim())
      .filter(Boolean)
      .slice(0, 24)
  };
})()`);

console.log("\nDashboard:");
check("shop overview widget renders", dashboard.hasOverview);
check("shows a live style count", dashboard.hasLiveCount);
check("shows drafts waiting to publish", dashboard.hasDraftHint);
console.log(`  sidebar: ${dashboard.sidebar.join(" | ")}`);

// ---- product list ---------------------------------------------------------
await page.goto(`${BASE}/admin/collections/products`, { waitUntil: "networkidle", timeout: 90000 });

const list: ListReport = await page.evaluate(`(() => {
  const rows = [...document.querySelectorAll("table tbody tr")];
  const imgs = [...document.querySelectorAll("table tbody tr img")];
  const up = [...document.querySelectorAll('button[aria-label="Move this style up"]')];
  const down = [...document.querySelectorAll('button[aria-label="Move this style down"]')];
  const headings = [...document.querySelectorAll("table thead th")].map(t => t.textContent.trim());
  return {
    rowCount: rows.length,
    thumbnailCount: imgs.length,
    upButtons: up.length,
    downButtons: down.length,
    headings: headings.slice(0, 10)
  };
})()`);

console.log("\nProduct list:");
check("rows are listed", list.rowCount > 0, `${list.rowCount} rows`);
check(
  "each row shows a garment photo",
  list.thumbnailCount >= list.rowCount - 1 && list.thumbnailCount > 0,
  `${list.thumbnailCount} thumbnails`,
);
check("reorder arrows present", list.upButtons > 0 && list.downButtons > 0,
  `${list.upButtons} up / ${list.downButtons} down`);
console.log(`  columns: ${list.headings.join(" | ")}`);

// ---- product form ---------------------------------------------------------
const firstRowLink = await page.evaluate(`(() => {
  const a = document.querySelector('table tbody tr a[href*="/admin/collections/products/"]');
  return a ? a.getAttribute("href") : null;
})()`);

if (firstRowLink) {
  await page.goto(`${BASE}${firstRowLink}`, { waitUntil: "networkidle", timeout: 90000 });

  const form: FormReport = await page.evaluate(`(() => {
    const text = document.body.innerText;
    const tabLabels = [...document.querySelectorAll('[role="tab"], .tabs-field__tab, button')]
      .map(b => b.textContent.trim())
      .filter(t => t && t.length < 40);
    const jargon = ["Collections", "Globals", "Access Control", "Admin", "Dashboard"];
    return {
      tabCount: new Set(tabLabels).size,
      tabs: [...new Set(tabLabels)].slice(0, 20),
      hasPlainName: /What you call this style/i.test(text),
      hasSortExplained: /arrows in the list/i.test(text),
      jargonPresent: jargon.filter(j => text.includes(j))
    };
  })()`);

  console.log("\nProduct form:");
  check("name field explains itself in plain words", form.hasPlainName);
  check("order field points at the arrows", form.hasSortExplained);
  check("no CMS jargon in the form", form.jargonPresent.length === 0, form.jargonPresent.join(", "));
  console.log(`  tabs: ${form.tabs.slice(0, 12).join(" | ")}`);
} else {
  console.log("\nProduct form: could not find a row link to open");
  failures += 1;
}

if (consoleErrors.length) {
  console.log(`\npage errors (${consoleErrors.length}):`);
  consoleErrors.slice(0, 5).forEach((e) => console.log(`  - ${e.slice(0, 240)}`));
}

console.log(failures === 0 ? "\nAll admin UI checks passed." : `\n${failures} check(s) FAILED.`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);