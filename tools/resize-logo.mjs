/**
 * Resizes the brand logo to a sensible pixel size while keeping its alpha
 * channel intact, then leaves it for the browser to serve directly.
 *
 * Why this exists: Next's image optimiser re-encodes the logo for each slot. At
 * the 44px header slot it asked for w=48, and the downscale from 1024 destroyed
 * the transparency, leaving the mark sitting on the page as a dark haze instead
 * of clean artwork. Pre-shrinking the file here and serving it unoptimised
 * avoids both problems, because a 256px logo is already the right size for a
 * 44px slot and never needs re-encoding.
 *
 * The resize runs in the browser, via canvas, which carries the alpha channel
 * through rather than flattening it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BROWSERS = [
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const TARGET = path.resolve(ROOT, getArg("--in", "public/brand/logo.png"));
const SIZE = Number(getArg("--size", "256"));

if (!fs.existsSync(TARGET)) {
  console.error(`Missing logo: ${path.relative(ROOT, TARGET)}`);
  process.exit(1);
}

const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) {
  console.error("No Chromium browser found to run the resize in.");
  process.exit(1);
}

const original = fs.readFileSync(TARGET);
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();

await page.setContent(
  `<body style="margin:0"><img id="l" src="data:image/png;base64,${original.toString("base64")}"></body>`,
);

const result = await page.evaluate(async (size) => {
  const img = document.getElementById("l");
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // The logo is square, so this is a plain scale with no crop.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  const probe = ctx.getImageData(0, 0, size, size).data;
  let trans = 0;
  let opq = 0;
  let part = 0;
  for (let i = 3; i < probe.length; i += 4) {
    if (probe[i] === 0) trans++;
    else if (probe[i] === 255) opq++;
    else part++;
  }
  const px = (x, y) => {
    const i = (y * size + x) * 4;
    return [probe[i], probe[i + 1], probe[i + 2], probe[i + 3]];
  };

  return {
    source: `${img.naturalWidth}x${img.naturalHeight}`,
    dataUrl: canvas.toDataURL("image/png"),
    transparentPct: +((trans / (size * size)) * 100).toFixed(1),
    opaquePct: +((opq / (size * size)) * 100).toFixed(1),
    partialPct: +((part / (size * size)) * 100).toFixed(1),
    cornerTL: px(1, 1),
    cornerBR: px(size - 2, size - 2),
  };
}, SIZE);

await browser.close();

const out = Buffer.from(result.dataUrl.split(",")[1], "base64");
fs.writeFileSync(TARGET, out);

console.log(`Resized ${path.relative(ROOT, TARGET)}`);
console.log(`  ${result.source} -> ${SIZE} x ${SIZE}`);
console.log(`  ${(original.length / 1024).toFixed(1)} KB -> ${(out.length / 1024).toFixed(1)} KB`);
console.log(`  alpha: ${result.transparentPct}% clear, ${result.opaquePct}% solid, ${result.partialPct}% soft edges`);
console.log(`  corner check: top-left rgba(${result.cornerTL.join(",")}), bottom-right rgba(${result.cornerBR.join(",")})`);