#!/usr/bin/env node
/**
 * Saves the account's profile picture, which for a brand is its logo.
 *
 * Instagram's profile header also contains a wide "cover photo" placeholder, and
 * that stock image is the largest picture on the page, so a naive "biggest
 * image" search always returns the placeholder rather than the logo. The
 * placeholder is 1647x1362, which is only 1.21:1, so loose "roughly square"
 * bounds are not enough to exclude it: this script measures the real decoded
 * size of each candidate and insists on something genuinely square (0.92:1 to
 * 1.08:1), which the wide placeholder can never satisfy.
 *
 * It also only looks inside the profile header, so avatars belonging to
 * suggested accounts further down the page cannot be picked up instead.
 *
 * Usage:
 *   node tools/fetch-logo.mjs
 *   node tools/fetch-logo.mjs --handle kiviakurtis --browser brave
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openLoggedIn } from "./ig-session.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT = path.join(ROOT, "public", "brand");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const HANDLE = getArg("--handle", "kiviakurtis");

(async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const session = await openLoggedIn(args, HANDLE);
  if (!session.ok) process.exit(1);
  const { ctx, page } = session;

const candidates = await page.evaluate((handle) => {
    const header =
      document.querySelector("header") ||
      document.querySelector("main") ||
      document.body;

    const seen = new Set();
    const out = [];

    for (const el of header.querySelectorAll("img")) {
      const url = el.currentSrc || el.src;
      if (!url || url.startsWith("data:") || seen.has(url)) continue;
      seen.add(url);

      const alt = el.getAttribute("alt") || "";
      // Instagram labels the avatar itself; the cover photo is described as a
      // photo of the account, so drop anything that reads like a cover.
      const isCover = /cover/i.test(alt);
      // Suggested accounts further down the page carry no useful label.
      const isAvatarLabel = /profile picture/i.test(alt);

      out.push({
        url,
        alt,
        isCover,
        isAvatarLabel,
        displayWidth: el.naturalWidth || el.width || 0,
      });
    }

    // Prefer a labelled avatar, then larger images, and never a cover.
    out.sort((a, b) => {
      if (a.isAvatarLabel !== b.isAvatarLabel) return a.isAvatarLabel ? -1 : 1;
      if (a.isCover !== b.isCover) return a.isCover ? 1 : -1;
      return b.displayWidth - a.displayWidth;
    });

    return out.map((c) => ({ ...c, handle }));
  }, HANDLE);

  if (!candidates.length) {
    console.log("No images found in the profile header.");
    console.log("\nSave your logo manually as:");
    console.log("  public/brand/logo.png");
    await ctx.close();
    process.exit(1);
  }

  /**
   * Loads a candidate in the page and reads the browser's own decoded size.
   * The element's attributes cannot be trusted: a srcset may advertise a wide
   * crop, and Instagram renders the avatar inside a fixed box.
   */
  async function measure(url) {
    return page.evaluate(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () =>
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: 0, height: 0 });
          img.src = src;
        }),
      url,
    );
  }

  // A logo is square. The 1647x1362 cover placeholder is 1.21:1, so these tight
  // bounds exclude it while still allowing minor rounding.
  const MIN_RATIO = 0.92;
  const MAX_RATIO = 1.08;

  let picked = null;
  const rejected = [];

  for (const candidate of candidates) {
    const { width, height } = await measure(candidate.url);
    if (!width || !height) {
      rejected.push({ url: candidate.url, reason: "could not be decoded" });
      continue;
    }

    const ratio = width / height;
    if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
      rejected.push({
        url: candidate.url,
        reason: `${width}x${height} is ${ratio.toFixed(2)}:1, not square`,
      });
      continue;
    }
    if (width < 120) {
      rejected.push({
        url: candidate.url,
        reason: `${width}x${height} is too small`,
      });
      continue;
    }

    picked = { ...candidate, width, height, candidates: candidates.length };
    break;
  }

  for (const r of rejected) {
    console.log(`  skipped ${r.reason}`);
  }

  if (!picked) {
    console.log("No square avatar found in the profile header.");
    console.log("Instagram may not have a profile picture set on this account.");
    console.log("\nIf so, save your logo manually as:");
    console.log("  public/brand/logo.png");
    await ctx.close();
    process.exit(1);
  }

  const res = await page.request.get(picked.url, { timeout: 60000 });
  if (!res.ok()) {
    console.log(`Avatar download failed with status ${res.status()}.`);
    await ctx.close();
    process.exit(1);
  }

  const buf = await res.body();
  const type = (res.headers()["content-type"] || "").toLowerCase();
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";

  // Remove anything an earlier run left behind so only one logo exists.
  for (const old of fs.readdirSync(OUT)) {
    if (/^logo\./i.test(old)) fs.rmSync(path.join(OUT, old));
  }

  const file = path.join(OUT, `logo.${ext}`);
  fs.writeFileSync(file, buf);

  console.log(`Saved ${path.relative(ROOT, file)}`);
  console.log(`  ${picked.width} x ${picked.height}, ${(buf.length / 1024).toFixed(1)} KB`);
  console.log(`  checked ${picked.candidates} header image(s), ${rejected.length} skipped`);

  await ctx.close();
})().catch((e) => {
  console.error("\n" + (e && e.stack ? e.stack : e));
  process.exit(1);
});