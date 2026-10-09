/**
 * Loads the admin login page in a real browser and reports anything that goes
 * wrong, including errors that only appear after hydration.
 *
 * Fetching the HTML alone is not enough here: an admin page can return 200 and
 * still throw on the client, which is what a person actually sees.
 */

import fs from "node:fs";
import { chromium } from "playwright-core";

const BRAVE = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const exe = [BRAVE, EDGE].find((p) => fs.existsSync(p));

if (!exe) {
  console.error("No Chromium browser found.");
  process.exit(1);
}

const BASE = process.env.ADMIN_URL ?? "http://localhost:3000";
const paths = ["/admin/login", "/admin", "/admin/create-first-user"];

const browser = await chromium.launch({ executablePath: exe, headless: true });

for (const path of paths) {
  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  let status = 0;
  let finalUrl = "";
  try {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 90000 });
    status = res?.status() ?? 0;
    finalUrl = page.url();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    consoleErrors.push(`navigation failed: ${message}`);
  }

  // Payload renders errors into the DOM, so look for what a person would read.
  let visible = "";
  try {
    visible = await page.evaluate(() => {
      const el =
        document.querySelector('[class*="error"], [role="alert"], .Toastify__toast--error') ??
        null;
      const text = el ? el.textContent?.trim() : "";
      const heading = document.querySelector("h1, h2")?.textContent?.trim() ?? "";
      const inputs = [...document.querySelectorAll("input")].map((i) =>
        `${i.type}:${i.name || "(unnamed)"}`,
      );
      return JSON.stringify(
        { errorText: text.slice(0, 300), heading: heading.slice(0, 120), inputs },
        null,
        2,
      );
    });
  } catch {
    visible = "(could not read the page)";
  }

  console.log(`\n=== ${path} ===`);
  console.log(`  status: ${status}`);
  console.log(`  landed on: ${finalUrl.replace(BASE, "") || finalUrl}`);
  console.log(`  visible: ${visible}`);
  if (consoleErrors.length) {
    console.log("  console errors:");
    consoleErrors.slice(0, 6).forEach((e) => console.log(`    - ${e.slice(0, 300)}`));
  }
  if (pageErrors.length) {
    console.log("  page errors:");
    pageErrors.slice(0, 6).forEach((e) => console.log(`    - ${e.slice(0, 300)}`));
  }
  if (failedRequests.length) {
    console.log("  failed requests:");
    failedRequests.slice(0, 6).forEach((e) => console.log(`    - ${e.slice(0, 200)}`));
  }

  await page.close();
}

await browser.close();