#!/usr/bin/env node
/**
 * Scans public/products for images and wires their paths into src/lib/catalog.ts.
 *
 * How it works: drop a photo into public/products/ named after the product's
 * slug, e.g. public/products/Dd8JKRdBWPy.jpg, then run:
 *
 *   npm run sync:images
 *
 * Each product in the catalog keeps a single `image:` field. The script sets it
 * to "/products/<slug>.<ext>" when a matching file exists and leaves the field as
 * null otherwise, so products without a photo keep showing the placeholder.
 */

import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsDir = join(root, "public", "products");
const catalogPath = join(root, "src", "lib", "catalog.ts");
// Instagram post codes, e.g. Dd8JKRdBWPy, are the filename stems the harvest
// produces. Product slugs are also accepted so hand-named files still work.
const filePattern = /^([A-Za-z0-9][A-Za-z0-9_-]*)\.(jpg|jpeg|png|webp|avif)$/i;

if (!existsSync(productsDir)) {
  console.error(`Missing folder: ${productsDir}`);
  process.exit(1);
}

const files = readdirSync(productsDir).filter((f) => !f.startsWith("."));
const found = new Map();

for (const file of files) {
  const match = file.match(filePattern);
  if (!match) continue;
  const [, slug] = match;
  found.set(slug, `/products/${file}`);
}

let catalog = readFileSync(catalogPath, "utf8");
/**
 * Rewrites the `image:` field of the product whose slug starts at slugIndex.
 * Returns the updated catalog, or null when the slug is unknown or already correct.
 */
function setImage(catalog, slug, publicPath) {
  const slugIndex = catalog.indexOf(`slug: "${slug}"`);
  if (slugIndex === -1) return null;

  // Scan the whole product object, tracking nesting depth, so that }, inside a
  // nested array or object is not mistaken for the end of the product.
  const start = catalog.lastIndexOf("{", slugIndex);
  if (start === -1) return null;

  let depth = 0;
  let end = -1;
  for (let i = start; i < catalog.length - 1; i += 1) {
    const char = catalog[i];
    const next = catalog[i + 1];
    if (char === "[" || char === "{") {
      depth += 1;
    } else if (char === "]" || char === "}") {
      depth -= 1;
      if (depth === 0 && char === "}" && next === ",") {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;

  const block = catalog.slice(slugIndex, end);
  const match = block.match(/image:\s*(null|"[^"]*")/);
  if (!match) return null;

  const desired = publicPath === null ? "null" : `"${publicPath}"`;
  if (match[1] === desired) return catalog;

  return catalog.slice(0, slugIndex) + block.replace(match[0], `image: ${desired}`) + catalog.slice(end);
}

let wired = 0;
let cleared = 0;

for (const [slug, publicPath] of found) {
  const next = setImage(catalog, slug, publicPath);
  if (next === null) {
    console.warn(`  ! No product with slug "${slug}" in catalog.ts - skipped`);
    continue;
  }
  if (next === catalog) continue;
  catalog = next;
  wired += 1;
  console.log(`  + ${slug} -> ${publicPath}`);
}

for (const match of catalog.matchAll(/slug:\s*"([A-Za-z0-9][A-Za-z0-9_-]*)"/g)) {
  const slug = match[1];
  if (found.has(slug)) continue;
  const next = setImage(catalog, slug, null);
  if (next === null || next === catalog) continue;
  catalog = next;
  cleared += 1;
  console.log(`  - ${slug} -> null (file no longer present)`);
}

writeFileSync(catalogPath, catalog);

const remaining = [...catalog.matchAll(/image:\s*null/g)].length;
console.log(`\nDone. ${wired} wired, ${cleared} cleared, ${remaining} products still without a photo.`);