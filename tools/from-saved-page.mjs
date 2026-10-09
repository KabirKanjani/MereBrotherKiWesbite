#!/usr/bin/env node
/**
 * Reads posts from an Instagram profile page you saved yourself.
 *
 * This is the no-credentials route. You open your profile in your own browser,
 * where you are already logged in, scroll the grid, save the page, and this
 * script parses the saved HTML. It never touches a password, never opens a
 * remote debugging port, and never drives your browser.
 *
 * Usage:
 *   node tools/from-saved-page.mjs "C:\path\to\(7) Instagram.html"
 *
 * Repeated runs merge into tools/harvest.json, so saving the page twice
 * (after scrolling further) adds to what you already have.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARVEST = path.join(HERE, "harvest.json");
const ASSETS = path.join(HERE, "harvest");

const args = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const HTML = args.find((a) => !a.startsWith("--")) || arg("--html", "");
const HANDLE = arg("--handle", "kiviakurtis");

if (!HTML || !fs.existsSync(HTML)) {
  console.error('Pass the saved .html file:');
  console.error('  node tools/from-saved-page.mjs "C:\\path\\to\\(7) Instagram.html"');
  process.exit(1);
}

// A save produces "<name>.html" plus a "<name>_files" folder holding the images.
// Match on the filename rather than directory listing order, because several
// saves usually sit side by side and listing order would cross-match them.
const expected = path.basename(HTML).replace(/\.html?$/i, "_files");
let resourcesDir = null;

if (
  fs.existsSync(path.join(path.dirname(HTML), expected)) &&
  fs.statSync(path.join(path.dirname(HTML), expected)).isDirectory()
) {
  resourcesDir = expected;
} else {
  const dir = path.dirname(HTML);
  const candidates = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith("_files") && fs.statSync(path.join(dir, f), { throwIfNoEntry: false })?.isDirectory?.());
  const alt = candidates.find(
    (f) => f.replace(/_files$/i, "") === path.basename(HTML).replace(/\.html?$/i, ""),
  );
  if (alt) resourcesDir = alt;
}

if (!resourcesDir) {
  console.error(`No matching resources folder for ${path.basename(HTML)}.`);
  console.error(`Save as "Webpage, Complete" so the images land in a ${expected} folder.`);
  process.exit(1);
}

fs.mkdirSync(ASSETS, { recursive: true });

const RES = path.join(path.dirname(HTML), resourcesDir);
const html = fs.readFileSync(HTML, "utf8");

// Index every saved image by filename, since a save may nest assets in subfolders.
const imageIndex = new Map();
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name) && !imageIndex.has(entry.name)) {
      imageIndex.set(entry.name, full);
    }
  }
})(RES);

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

// Instagram serves two link shapes: /p/CODE/ and /HANDLE/reel/CODE/. Anchoring
// the pattern right after the domain silently misses every reel.
const shortcodeOf = (href) => {
  const m = href.match(/instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
};

const rows = [];
const seen = new Set();
const missingImage = [];

const anchorRe =
  /<a\b[^>]*href="([^"]*\/[^/"?#]+\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?[^"]*)"[^>]*>([\s\S]{0,20000}?)<\/a>/gi;

let m;
while ((m = anchorRe.exec(html)) !== null) {
  const href = decodeEntities(m[1]);
  const code = shortcodeOf(href);
  if (!code || seen.has(code)) continue;

  const inner = m[2];
  const imgMatch = inner.match(/<img[^>]+src="([^"]+)"/i);
  if (!imgMatch) continue;

  const src = decodeEntities(imgMatch[1]);

  // Instagram grid anchors wrap the thumbnail in a <picture>, so the first src
  // can be a tiny placeholder avatar while the real photo is in a srcset or a
  // later <img>. Try each candidate and take the first one that was saved.
  const candidates = new Set([src]);
  const srcset = inner.match(/srcset="([^"]+)"/i);
  if (srcset) {
    for (const part of srcset[1].split(",")) {
      candidates.add(decodeEntities(part.trim().split(/\s+/)[0]));
    }
  }
  for (const extra of inner.match(/<img[^>]+src="([^"]+)"/gi) || []) {
    const s = extra.match(/src="([^"]+)"/i);
    if (s) candidates.add(decodeEntities(s[1]));
  }

  let localPath = null;
  let wanted = null;
  for (const candidate of candidates) {
    const name = decodeURIComponent(candidate.split("?")[0]).split("/").filter(Boolean).pop();
    if (name && imageIndex.has(name)) {
      localPath = imageIndex.get(name);
      wanted = name;
      break;
    }
  }

  if (!localPath) {
    seen.add(code);
    missingImage.push(code);
    continue;
  }

  seen.add(code);
  const ext = (path.extname(wanted) || ".jpg").toLowerCase();
  const dest = `${code}${ext}`;
  const destPath = path.join(ASSETS, dest);
  if (!fs.existsSync(destPath)) fs.copyFileSync(localPath, destPath);

  rows.push({
    code,
    url: `https://www.instagram.com/${HANDLE}/p/${code}/`,
    media: `harvest/${dest}`,
  });
}

console.log(`Read ${path.basename(HTML)}`);
console.log(`  post links found     : ${new Set(html.match(/instagram\.com\/[^/"?#]+\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/g) || []).size}`);
console.log(`  links with an <img>  : ${seen.size}`);
console.log(`  post + image pairs   : ${rows.length}`);
console.log(`  images copied        : ${rows.length} into tools/harvest/`);
console.log(`  images in ${resourcesDir}: ${imageIndex.size} (rest are avatars and avatars of suggested accounts)`);

if (missingImage.length) {
  console.log(`\n  ${missingImage.length} posts had a link but no image file was saved:`);
  console.log(`    ${missingImage.slice(0, 10).join(" ")}${missingImage.length > 10 ? " ..." : ""}`);
}

if (!rows.length) {
  console.error(`\n  Nothing extracted. Likely causes:`);
  console.error(`   - the grid had not rendered when you saved, or`);
  console.error(`   - you were not logged in, so Instagram showed a login wall, or`);
  console.error(`   - it was not saved as "Webpage, Complete"`);
  console.error(`\n  Retry:`);
  console.error(`    1. open https://www.instagram.com/${HANDLE}/ in your browser`);
  console.error(`    2. confirm the grid renders (not a login prompt)`);
  console.error(`    3. scroll until the grid stops adding rows`);
  console.error(`    4. wait a few seconds, then Ctrl+S -> "Webpage, Complete"`);
  process.exit(1);
}

// Merge across runs so saving the page again after scrolling further only adds.
const existing = fs.existsSync(HARVEST)
  ? JSON.parse(fs.readFileSync(HARVEST, "utf8"))
  : { handle: HANDLE, harvested: [] };

const prev = new Map((existing.harvested || []).map((r) => [r.code, r]));
for (const r of rows) prev.set(r.code, { ...prev.get(r.code), ...r });
const merged = [...prev.values()];

fs.writeFileSync(
  HARVEST,
  JSON.stringify(
    {
      handle: existing.handle || HANDLE,
      capturedAt: new Date().toISOString(),
      count: merged.length,
      harvested: merged,
    },
    null,
    2,
  ),
);

console.log(`\n  harvest.json now holds ${merged.length} posts`);
console.log(`\n  Note: a saved page carries no dates and no captions, only what was on screen.`);
console.log(`        For dates and captions you would need tools/harvest.mjs --mode full,`);
console.log(`        which opens its own browser and waits for you to log in yourself.`);